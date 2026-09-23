import { Pool, type PoolClient } from "@neondatabase/serverless";
import { createHash, randomUUID } from "node:crypto";
import type { ArticleCandidate, MediaUsageStatus } from "../domain/types.js";
import { canonicalizeHttpUrl } from "../domain/url.js";
import { SCOUT_PROMPT_VERSION } from "../ai/scout.js";
import { EDITOR_PROMPT_VERSION } from "../ai/editor.js";
import type { ContentStore } from "./content-store.js";
import type { DailyEditionRecord, PersistedPipelineRun, EditorialEditionRecord, CardLifecycleStatus, EditionStatus, PublicEditionRecord, PublicFeedRecord, PublicGameCardRecord, PredictionResolutionInput, PredictionVoidInput, DraftCardEditInput, GameplayAnswerRecord } from "./types.js";
import { evaluatePublishedAnswer } from "../gameplay/answer.js";

function requireDatabaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is not configured");
  return value;
}

function sourceKey(name: string): string {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "source";
  const digest = createHash("sha256").update(name.trim()).digest("hex").slice(0, 12);
  return `${normalized}-${digest}`;
}

export class NeonContentStore implements ContentStore {
  private readonly pool: Pool;

  constructor(connectionString = requireDatabaseUrl()) {
    this.pool = new Pool({ connectionString });
  }

  async tryAcquireGenerationLease(leaseKey: string, ttlSeconds: number): Promise<string | null> {
    const ttl = Math.max(60, Math.min(Math.trunc(ttlSeconds), 3_600));
    const ownerToken = randomUUID();
    const result = await this.pool.query(
      `insert into generation_leases (lease_key, owner_token, acquired_at, expires_at)
       values ($1,$2,now(),now() + make_interval(secs => $3))
       on conflict (lease_key) do update set
         owner_token=excluded.owner_token,
         acquired_at=excluded.acquired_at,
         expires_at=excluded.expires_at
       where generation_leases.expires_at <= now()
       returning owner_token`,
      [leaseKey, ownerToken, ttl]
    );
    return (result.rowCount ?? 0) > 0 ? String(result.rows[0].owner_token) : null;
  }

  async releaseGenerationLease(leaseKey: string, ownerToken: string): Promise<void> {
    await this.pool.query(
      "delete from generation_leases where lease_key=$1 and owner_token=$2",
      [leaseKey, ownerToken]
    );
  }

  async findProcessedCandidateIds(candidates: ArticleCandidate[]): Promise<Set<string>> {
    if (candidates.length === 0) return new Set();
    const externalIds = candidates.map(candidate => candidate.id);
    const canonicalUrls = candidates.map(candidate => candidate.sourceUrl);
    const result = await this.pool.query(
      `select distinct a.external_id, a.canonical_url
         from articles a
         join scout_results s on s.article_id = a.id
        where (a.external_id = any($1::text[])
           or a.canonical_url = any($2::text[]))
          and s.prompt_version = $3`,
      [externalIds, canonicalUrls, SCOUT_PROMPT_VERSION]
    );
    const processedExternalIds = new Set(result.rows.map(row => String(row.external_id)));
    const processedCanonicalUrls = new Set(result.rows.map(row => String(row.canonical_url)));
    return new Set(
      candidates
        .filter(candidate =>
          processedExternalIds.has(candidate.id) || processedCanonicalUrls.has(candidate.sourceUrl)
        )
        .map(candidate => candidate.id)
    );
  }

  async findKnownStoryCandidateIds(candidates: ArticleCandidate[]): Promise<Set<string>> {
    if (candidates.length === 0) return new Set();
    const externalIds = candidates.map(candidate => candidate.id);
    const canonicalUrls = candidates.map(candidate => candidate.sourceUrl);
    const titles = candidates.map(candidate => candidate.title);
    const result = await this.pool.query(
      `with input as (
         select * from unnest($1::text[], $2::text[], $3::text[])
           as t(external_id, canonical_url, title)
       )
       select distinct input.external_id
         from input
        where exists (
          select 1
            from articles a
            join game_cards gc on gc.article_id=a.id
           where gc.lifecycle_status <> 'rejected'
             and (
               a.canonical_url = input.canonical_url
               or similarity(lower(a.title), lower(input.title)) >= 0.66
             )
        )`,
      [externalIds, canonicalUrls, titles]
    );
    return new Set(result.rows.map(row => String(row.external_id)));
  }

  async saveCompletedRun(run: PersistedPipelineRun): Promise<{ runId: string; cardIds: string[] }> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const runResult = await client.query(
        `insert into pipeline_runs
           (status, prompt_versions, model_versions, diagnostics, estimated_cost_usd, completed_at)
         values ('completed', $1::jsonb, $2::jsonb, $3::jsonb, $4, now())
         returning id`,
        [
          JSON.stringify({ scout: SCOUT_PROMPT_VERSION, editor: EDITOR_PROMPT_VERSION }),
          JSON.stringify({ scout: run.ai.scout.model, editor: run.ai.editor.model }),
          JSON.stringify({ collection: run.collection }),
          run.ai.totalEstimatedCostUsd
        ]
      );
      const runId = String(runResult.rows[0].id);
      const articleIds = new Map<string, string>();

      for (const candidate of run.candidates) {
        const articleId = await this.upsertArticle(client, candidate);
        articleIds.set(candidate.id, articleId);
      }

      const scoutIds = new Map<string, string>();
      for (const scout of run.scoutResults) {
        const articleId = articleIds.get(scout.articleId);
        if (!articleId) continue;
        const result = await client.query(
          `insert into scout_results
             (article_id, run_id, prompt_version, model, decision, modes, scores, reason, evidence_status, raw_output)
           values ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10::jsonb)
           on conflict (article_id, prompt_version) do update set
             article_id=excluded.article_id
           returning id`,
          [articleId, runId, SCOUT_PROMPT_VERSION, run.ai.scout.model, scout.decision,
           JSON.stringify(scout.modes), JSON.stringify(scout.scores), scout.reason,
           scout.evidenceStatus, JSON.stringify(scout)]
        );
        scoutIds.set(scout.articleId, String(result.rows[0].id));
      }

      const cardIds: string[] = [];
      for (const card of run.cards) {
        const articleId = articleIds.get(card.articleId);
        if (!articleId) continue;
        const result = await client.query(
          `insert into game_cards
             (article_id, scout_result_id, run_id, prompt_version, model, mode, interaction_type, category,
              hook, question, options, correct_option_index, reveal, resolution_rule)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14)
           on conflict (article_id, prompt_version) do update set
             article_id=excluded.article_id
           returning id`,
          [articleId, scoutIds.get(card.articleId) ?? null, runId, EDITOR_PROMPT_VERSION,
           run.ai.editor.model, card.mode, card.interactionType, card.category,
           card.hook, card.question, JSON.stringify(card.options),
           card.correctOptionIndex, card.reveal, card.resolutionRule]
        );
        cardIds.push(String(result.rows[0].id));
      }

      await client.query("commit");
      return { runId, cardIds };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async appendDraftEdition(editionDate: string, cardIds: string[]): Promise<DailyEditionRecord> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await client.query(
        `insert into daily_editions (edition_date, status)
         values ($1, 'draft')
         on conflict (edition_date) do update set edition_date=excluded.edition_date
         returning id, edition_date::text, status`,
        [editionDate]
      );
      const editionId = String(result.rows[0].id);
      if (result.rows[0].status !== "draft") {
        throw new Error(`Edition ${editionDate} is ${result.rows[0].status} and cannot be mutated`);
      }

      const positionResult = await client.query(
        "select coalesce(max(position), -1) + 1 as next_position from daily_edition_cards where edition_id=$1",
        [editionId]
      );
      let position = Number(positionResult.rows[0].next_position);

      for (const cardId of cardIds) {
        const inserted = await client.query(
          `insert into daily_edition_cards (edition_id, card_id, position)
           values ($1,$2,$3)
           on conflict (edition_id, card_id) do nothing
           returning card_id`,
          [editionId, cardId, position]
        );
        if ((inserted.rowCount ?? 0) > 0) position += 1;
      }

      const cards = await client.query(
        "select card_id from daily_edition_cards where edition_id=$1 order by position",
        [editionId]
      );
      await client.query("commit");
      return {
        id: editionId,
        editionDate: String(result.rows[0].edition_date),
        status: "draft",
        cardIds: cards.rows.map(row => String(row.card_id))
      };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async getEdition(editionDate: string): Promise<DailyEditionRecord | null> {
    const edition = await this.pool.query(
      "select id, edition_date::text, status from daily_editions where edition_date=$1",
      [editionDate]
    );
    if (edition.rowCount === 0) return null;
    const id = String(edition.rows[0].id);
    const cards = await this.pool.query(
      "select card_id from daily_edition_cards where edition_id=$1 order by position",
      [id]
    );
    return {
      id,
      editionDate: String(edition.rows[0].edition_date),
      status: edition.rows[0].status,
      cardIds: cards.rows.map(row => String(row.card_id))
    };
  }

  async getEditorialEdition(editionDate: string): Promise<EditorialEditionRecord | null> {
    const edition = await this.getEdition(editionDate);
    if (!edition) return null;
    const result = await this.pool.query(
      `select gc.id, gc.article_id, gc.mode, gc.interaction_type, gc.category,
              gc.hook, gc.question, gc.options, gc.correct_option_index, gc.reveal,
              gc.resolution_rule, gc.lifecycle_status, a.source_name, a.source_url, a.title,
              a.image_url_original, a.image_url_cached, a.image_alt_text, a.image_usage_status
         from daily_edition_cards dec
         join game_cards gc on gc.id = dec.card_id
         join articles a on a.id = gc.article_id
        where dec.edition_id = $1
        order by dec.position`,
      [edition.id]
    );
    return {
      ...edition,
      cards: result.rows.map(row => ({
        id: String(row.id),
        articleId: String(row.article_id),
        mode: row.mode,
        interactionType: row.interaction_type,
        category: row.category,
        hook: row.hook,
        question: row.question,
        options: row.options,
        correctOptionIndex: row.correct_option_index,
        reveal: row.reveal,
        resolutionRule: row.resolution_rule,
        lifecycleStatus: row.lifecycle_status,
        sourceName: row.source_name,
        sourceUrl: row.source_url,
        title: row.title,
        imageUrlOriginal: row.image_url_original ?? null,
        imageUrlCached: row.image_url_cached ?? null,
        imageAltText: row.image_alt_text ?? null,
        imageUsageStatus: row.image_usage_status
      }))
    };
  }

  async getPublishedEdition(editionDate: string): Promise<PublicEditionRecord | null> {
    const result = await this.pool.query(
      `select de.edition_date::text, gc.id, gc.mode, gc.interaction_type, gc.category,
              gc.hook, gc.question, gc.options, gc.resolution_rule, gc.correct_option_index,
              gc.reveal, gc.lifecycle_status, gc.resolution, gc.published_at,
              a.source_name, a.source_url, a.image_url_original, a.image_url_cached,
              a.image_alt_text, a.image_usage_status
         from daily_editions de
         join daily_edition_cards dec on dec.edition_id=de.id
         join game_cards gc on gc.id=dec.card_id
         join articles a on a.id=gc.article_id
        where de.edition_date=$1
          and de.status='published'
          and gc.lifecycle_status in ('published','open','resolved','void')
        order by dec.position`,
      [editionDate]
    );
    if (result.rowCount === 0) return null;
    return {
      editionDate: String(result.rows[0].edition_date),
      cards: result.rows.map(row => {
        const resolved = row.lifecycle_status === "resolved";
        const voided = row.lifecycle_status === "void";
        return {
          id: String(row.id),
          mode: row.mode,
          interactionType: row.interaction_type,
          category: row.category,
          status: row.lifecycle_status,
          hook: row.hook,
          question: row.question,
          options: row.options,
          resolutionRule: row.mode === "PREDICT" ? row.resolution_rule : null,
          resolvedOptionIndex: resolved ? Number(row.correct_option_index) : null,
          reveal: resolved ? row.reveal : null,
          voidReason: voided && row.resolution?.reason ? String(row.resolution.reason) : null,
          resolutionEvidenceUrl:
            (resolved || voided) && row.resolution?.evidenceUrl ? String(row.resolution.evidenceUrl) : null,
          sourceName: row.source_name,
          sourceUrl: row.source_url,
          imageUrl: ["remote-display", "cache-allowed", "owned"].includes(row.image_usage_status)
            ? (row.image_url_cached ?? row.image_url_original ?? null)
            : null,
          imageAltText: row.image_alt_text ?? null,
          publishedAt: row.published_at
            ? new Date(row.published_at).toISOString()
            : new Date(0).toISOString()
        };
      })
    };
  }

  async updateDraftCard(
    editionDate: string,
    cardId: string,
    input: DraftCardEditInput
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const edition = await client.query(
        "select id, status from daily_editions where edition_date=$1 for update",
        [editionDate]
      );
      if (edition.rowCount === 0) throw new Error(`Edition ${editionDate} not found`);
      if (edition.rows[0].status !== "draft") {
        throw new Error(`Edition ${editionDate} is ${edition.rows[0].status} and card editing is frozen`);
      }
      const editionId = String(edition.rows[0].id);
      const result = await client.query(
        `update game_cards gc
            set hook=$3,
                question=$4,
                options=$5::jsonb,
                correct_option_index=$6,
                reveal=$7,
                resolution_rule=$8,
                updated_at=now()
          where gc.id=$2
            and gc.lifecycle_status='draft'
            and exists (
              select 1 from daily_edition_cards dec
               where dec.card_id=gc.id and dec.edition_id=$1
            )
            and not exists (
              select 1
                from daily_edition_cards dec
                join daily_editions de on de.id=dec.edition_id
               where dec.card_id=gc.id and de.status <> 'draft'
            )
          returning id`,
        [
          editionId,
          cardId,
          input.hook,
          input.question,
          JSON.stringify(input.options),
          input.correctOptionIndex,
          input.reveal,
          input.resolutionRule
        ]
      );
      if (result.rowCount === 0) throw new Error(`Card ${cardId} cannot be edited`);
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async setCardLifecycle(
    editionDate: string,
    cardId: string,
    status: Extract<CardLifecycleStatus, "reviewed" | "rejected">
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const edition = await client.query(
        "select id, status from daily_editions where edition_date=$1 for update",
        [editionDate]
      );
      if (edition.rowCount === 0) throw new Error(`Edition ${editionDate} not found`);
      if (edition.rows[0].status !== "draft") {
        throw new Error(`Edition ${editionDate} is ${edition.rows[0].status} and card review is frozen`);
      }
      const editionId = String(edition.rows[0].id);
      const result = await client.query(
        `update game_cards gc
            set lifecycle_status=$3, updated_at=now()
          where gc.id=$2
            and gc.lifecycle_status in ('draft','reviewed','rejected')
            and exists (
              select 1 from daily_edition_cards dec
               where dec.card_id=gc.id and dec.edition_id=$1
            )
            and not exists (
              select 1
                from daily_edition_cards dec
                join daily_editions de on de.id=dec.edition_id
               where dec.card_id=gc.id and de.status <> 'draft'
            )
          returning id`,
        [editionId, cardId, status]
      );
      if (result.rowCount === 0) throw new Error(`Card ${cardId} cannot be moved to ${status}`);
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async setEditionStatus(
    editionDate: string,
    status: Extract<EditionStatus, "reviewed" | "published">
  ): Promise<DailyEditionRecord> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const locked = await client.query(
        "select id, edition_date::text, status from daily_editions where edition_date=$1 for update",
        [editionDate]
      );
      if (locked.rowCount === 0) throw new Error(`Edition ${editionDate} not found`);
      const editionId = String(locked.rows[0].id);
      const current = String(locked.rows[0].status);

      if (current === status) {
        const cards = await client.query(
          "select card_id from daily_edition_cards where edition_id=$1 order by position",
          [editionId]
        );
        await client.query("commit");
        return {
          id: editionId,
          editionDate: String(locked.rows[0].edition_date),
          status: current as EditionStatus,
          cardIds: cards.rows.map(row => String(row.card_id))
        };
      }

      if (status === "reviewed" && current !== "draft") {
        throw new Error(`Edition ${editionDate} must be draft before review`);
      }
      if (status === "published" && current !== "reviewed") {
        throw new Error(`Edition ${editionDate} must be reviewed before publish`);
      }

      if (status === "reviewed") {
        const counts = await client.query(
          `select count(*)::int as total,
                  count(*) filter (where gc.lifecycle_status='reviewed')::int as reviewed
             from daily_edition_cards dec
             join game_cards gc on gc.id=dec.card_id
            where dec.edition_id=$1 and gc.lifecycle_status <> 'rejected'`,
          [editionId]
        );
        if (Number(counts.rows[0].total) === 0 || Number(counts.rows[0].reviewed) !== Number(counts.rows[0].total)) {
          throw new Error("All non-rejected cards must be reviewed before the edition can be reviewed");
        }
      }

      if (status === "published") {
        await client.query(
          `update game_cards gc
              set lifecycle_status = case when gc.mode='PREDICT' then 'open' else 'published' end,
                  published_at=coalesce(gc.published_at, now()),
                  updated_at=now()
            where gc.id in (
              select dec.card_id from daily_edition_cards dec
               where dec.edition_id=$1
            ) and gc.lifecycle_status='reviewed'`,
          [editionId]
        );
      }

      await client.query(
        `update daily_editions
            set status=$2, published_at=case when $2='published' then now() else published_at end
          where id=$1`,
        [editionId, status]
      );
      const cards = await client.query(
        "select card_id from daily_edition_cards where edition_id=$1 order by position",
        [editionId]
      );
      await client.query("commit");
      return {
        id: editionId,
        editionDate: String(locked.rows[0].edition_date),
        status,
        cardIds: cards.rows.map(row => String(row.card_id))
      };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async getPublishedFeed(limit: number, before?: string): Promise<PublicFeedRecord> {
    const boundedLimit = Math.max(1, Math.min(Math.trunc(limit), 50));
    const beforeDate = before ? new Date(before) : null;
    if (beforeDate && Number.isNaN(beforeDate.getTime())) {
      throw new Error("Invalid feed cursor");
    }

    const result = await this.pool.query(
      `select gc.id, gc.mode, gc.interaction_type, gc.category, gc.hook, gc.question, gc.options,
              gc.resolution_rule, gc.correct_option_index, gc.reveal, gc.lifecycle_status,
              gc.resolution, gc.published_at, a.source_name, a.source_url,
              a.image_url_original, a.image_url_cached, a.image_alt_text, a.image_usage_status
         from game_cards gc
         join articles a on a.id=gc.article_id
        where gc.lifecycle_status in ('published','open','resolved','void')
          and gc.published_at is not null
          and ($2::timestamptz is null or gc.published_at < $2::timestamptz)
        order by gc.published_at desc, gc.id
        limit $1`,
      [boundedLimit, beforeDate?.toISOString() ?? null]
    );

    const cards: PublicGameCardRecord[] = result.rows.map(row => {
      const resolved = row.lifecycle_status === "resolved";
      const voided = row.lifecycle_status === "void";
      return {
        id: String(row.id),
        mode: row.mode,
        interactionType: row.interaction_type,
        category: row.category,
        status: row.lifecycle_status,
        hook: row.hook,
        question: row.question,
        options: row.options,
        resolutionRule: row.mode === "PREDICT" ? row.resolution_rule : null,
        resolvedOptionIndex: resolved ? Number(row.correct_option_index) : null,
        reveal: resolved ? row.reveal : null,
        voidReason: voided && row.resolution?.reason ? String(row.resolution.reason) : null,
        resolutionEvidenceUrl:
          (resolved || voided) && row.resolution?.evidenceUrl
            ? String(row.resolution.evidenceUrl)
            : null,
        sourceName: row.source_name,
        sourceUrl: row.source_url,
        imageUrl: ["remote-display", "cache-allowed", "owned"].includes(row.image_usage_status)
          ? (row.image_url_cached ?? row.image_url_original ?? null)
          : null,
        imageAltText: row.image_alt_text ?? null,
        publishedAt: new Date(row.published_at).toISOString()
      };
    });

    return { cards };
  }

  async answerPublishedCard(
    cardId: string,
    selectedOptionIndex: number
  ): Promise<GameplayAnswerRecord | null> {
    const result = await this.pool.query(
      `select id, options, correct_option_index, reveal
         from game_cards
        where id=$1
          and lifecycle_status='published'
          and published_at is not null
          and mode <> 'PREDICT'`,
      [cardId]
    );
    if (result.rowCount === 0) return null;

    const row = result.rows[0];
    if (!Array.isArray(row.options) || row.correct_option_index === null) {
      return null;
    }
    return evaluatePublishedAnswer(
      {
        id: String(row.id),
        options: row.options.map((option: unknown) => String(option)),
        correctOptionIndex: Number(row.correct_option_index),
        reveal: String(row.reveal)
      },
      selectedOptionIndex
    );
  }

  async setArticleMediaUsage(
    articleId: string,
    status: MediaUsageStatus,
    cachedUrl?: string
  ): Promise<void> {
    const allowed: MediaUsageStatus[] = [
      "unreviewed", "link-only", "remote-display", "cache-allowed", "owned"
    ];
    if (!allowed.includes(status)) throw new Error("Unsupported media usage status");
    const canonicalCachedUrl = cachedUrl ? canonicalizeHttpUrl(cachedUrl) : null;
    if (cachedUrl && !canonicalCachedUrl) throw new Error("cachedUrl must be HTTP(S)");

    const result = await this.pool.query(
      `update articles
          set image_usage_status=$2,
              image_url_cached=case when $3::text is null then image_url_cached else $3 end
        where id=$1
        returning id`,
      [articleId, status, canonicalCachedUrl]
    );
    if (result.rowCount === 0) throw new Error(`Article ${articleId} not found`);
  }

  async resolvePrediction(cardId: string, input: PredictionResolutionInput): Promise<void> {
    if (!Number.isInteger(input.outcomeOptionIndex) || input.outcomeOptionIndex < 0) {
      throw new Error("outcomeOptionIndex must be a non-negative integer");
    }
    const evidenceUrl = canonicalizeHttpUrl(input.evidenceUrl);
    if (!evidenceUrl || !input.evidenceNote.trim()) {
      throw new Error("Prediction resolution requires a valid HTTP(S) evidenceUrl and evidenceNote");
    }
    const result = await this.pool.query(
      `update game_cards
          set lifecycle_status='resolved',
              correct_option_index=$2,
              reveal=$4,
              resolution=jsonb_build_object(
                'outcomeOptionIndex',$2,
                'evidenceUrl',$3,
                'evidenceNote',$4,
                'resolvedAt',now()
              ),
              updated_at=now()
        where id=$1
          and mode='PREDICT'
          and lifecycle_status='open'
          and $2 < jsonb_array_length(options)
        returning id`,
      [cardId, input.outcomeOptionIndex, evidenceUrl, input.evidenceNote.trim()]
    );
    if (result.rowCount === 0) {
      throw new Error(`Prediction ${cardId} is not open or the outcome index is invalid`);
    }
  }

  async voidPrediction(cardId: string, input: PredictionVoidInput): Promise<void> {
    if (!input.reason.trim()) throw new Error("Void reason is required");
    const evidenceUrl = input.evidenceUrl ? canonicalizeHttpUrl(input.evidenceUrl) : null;
    if (input.evidenceUrl && !evidenceUrl) throw new Error("Void evidenceUrl must be HTTP(S)");
    const result = await this.pool.query(
      `update game_cards
          set lifecycle_status='void',
              resolution=jsonb_build_object(
                'reason',$2,
                'evidenceUrl',$3,
                'voidedAt',now()
              ),
              updated_at=now()
        where id=$1 and mode='PREDICT' and lifecycle_status='open'
        returning id`,
      [cardId, input.reason.trim(), evidenceUrl]
    );
    if (result.rowCount === 0) throw new Error(`Prediction ${cardId} is not open`);
  }

  private async upsertArticle(client: PoolClient, candidate: ArticleCandidate): Promise<string> {
    const source = await client.query(
      `insert into sources (source_key, name)
       values ($1,$2)
       on conflict (source_key) do update set name=excluded.name, updated_at=now()
       returning id`,
      [sourceKey(candidate.sourceName), candidate.sourceName]
    );
    const existing = await client.query(
      "select id, external_id, canonical_url from articles where external_id=$1 or canonical_url=$2",
      [candidate.id, candidate.sourceUrl]
    );
    if ((existing.rowCount ?? 0) > 1) {
      throw new Error(`Article identity collision for ${candidate.id} / ${candidate.sourceUrl}`);
    }
    if ((existing.rowCount ?? 0) === 1) {
      const articleId = String(existing.rows[0].id);
      await client.query(
        `update articles set
           external_id=$2, source_id=$3, source_name=$4, source_url=$5, canonical_url=$5,
           title=$6, summary=$7, published_at=$8, language=$9, country=$10,
           image_url_original=coalesce($11,image_url_original),
           image_alt_text=coalesce($12,image_alt_text),
           discovery_source=coalesce($13,discovery_source),
           category_hint=coalesce($14,category_hint),
           image_usage_status=case
             when image_usage_status='unreviewed' then coalesce($15,'unreviewed')
             else image_usage_status
           end,
           last_seen_at=now()
         where id=$1`,
        [articleId, candidate.id, source.rows[0].id, candidate.sourceName, candidate.sourceUrl, candidate.title,
         candidate.summary ?? null, candidate.publishedAt ?? null, candidate.language ?? null, candidate.sourceCountry ?? candidate.country ?? null,
         candidate.imageUrl ?? null, candidate.imageAlt ?? null, candidate.discoverySource ?? null,
         candidate.categoryHint ?? null, candidate.mediaUsageStatus ?? "unreviewed"]
      );
      return articleId;
    }
    const result = await client.query(
      `insert into articles
         (external_id, source_id, source_name, source_url, canonical_url, title, summary,
          published_at, language, country, image_url_original, image_alt_text,
          discovery_source, category_hint, image_usage_status)
       values ($1,$2,$3,$4,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       returning id`,
      [candidate.id, source.rows[0].id, candidate.sourceName, candidate.sourceUrl, candidate.title,
       candidate.summary ?? null, candidate.publishedAt ?? null, candidate.language ?? null, candidate.sourceCountry ?? candidate.country ?? null,
       candidate.imageUrl ?? null, candidate.imageAlt ?? null, candidate.discoverySource ?? null,
       candidate.categoryHint ?? null, candidate.mediaUsageStatus ?? "unreviewed"]
    );
    return String(result.rows[0].id);
  }
}
