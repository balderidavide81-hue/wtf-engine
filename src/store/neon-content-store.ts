import { Pool, type PoolClient } from "@neondatabase/serverless";
import type { ArticleCandidate } from "../domain/types.js";
import type { ContentStore } from "./content-store.js";
import type { DailyEditionRecord, PersistedPipelineRun, EditorialEditionRecord, CardLifecycleStatus, EditionStatus, PublicEditionRecord } from "./types.js";

const SCOUT_PROMPT_VERSION = "scout/v0.1";
const EDITOR_PROMPT_VERSION = "editor/v0.1";

function requireDatabaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is not configured");
  return value;
}

function sourceKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export class NeonContentStore implements ContentStore {
  private readonly pool: Pool;

  constructor(connectionString = requireDatabaseUrl()) {
    this.pool = new Pool({ connectionString });
  }

  async findProcessedExternalIds(externalIds: string[]): Promise<Set<string>> {
    if (externalIds.length === 0) return new Set();
    const result = await this.pool.query(
      `select distinct a.external_id
         from articles a
         join scout_results s on s.article_id = a.id
        where a.external_id = any($1::text[])`,
      [externalIds]
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
             (article_id, scout_result_id, run_id, prompt_version, model, mode, hook, question,
              options, correct_option_index, reveal, resolution_rule)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12)
           returning id`,
          [articleId, scoutIds.get(card.articleId) ?? null, runId, EDITOR_PROMPT_VERSION,
           run.ai.editor.model, card.mode, card.hook, card.question, JSON.stringify(card.options),
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
      `select gc.id, gc.article_id, gc.mode, gc.hook, gc.question, gc.options,
              gc.correct_option_index, gc.reveal, gc.resolution_rule, gc.lifecycle_status,
              a.source_name, a.source_url, a.title
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
        hook: row.hook,
        question: row.question,
        options: row.options,
        correctOptionIndex: row.correct_option_index,
        reveal: row.reveal,
        resolutionRule: row.resolution_rule,
        lifecycleStatus: row.lifecycle_status,
        sourceName: row.source_name,
        sourceUrl: row.source_url,
        title: row.title
      }))
    };
  }

  async getPublishedEdition(editionDate: string): Promise<PublicEditionRecord | null> {
    const result = await this.pool.query(
      `select de.edition_date::text, gc.id, gc.mode, gc.hook, gc.question, gc.options,
              gc.reveal, gc.correct_option_index, gc.lifecycle_status,
              a.source_name, a.source_url
         from daily_editions de
         join daily_edition_cards dec on dec.edition_id=de.id
         join game_cards gc on gc.id=dec.card_id
         join articles a on a.id=gc.article_id
        where de.edition_date=$1
          and de.status='published'
          and gc.lifecycle_status in ('published','open','resolved')
        order by dec.position`,
      [editionDate]
    );
    if (result.rowCount === 0) return null;
    return {
      editionDate: String(result.rows[0].edition_date),
      cards: result.rows.map(row => {
        const predictionOpen = row.mode === "PREDICT" && row.lifecycle_status === "open";
        return {
          id: String(row.id),
          mode: row.mode,
          hook: row.hook,
          question: row.question,
          options: row.options,
          reveal: predictionOpen ? null : row.reveal,
          sourceName: row.source_name,
          sourceUrl: row.source_url
        };
      })
    };
  }

  async setCardLifecycle(cardId: string, status: Extract<CardLifecycleStatus, "reviewed" | "rejected">): Promise<void> {
    const result = await this.pool.query(
      `update game_cards gc
          set lifecycle_status=$2, updated_at=now()
        where gc.id=$1
          and gc.lifecycle_status in ('draft','reviewed','rejected')
          and not exists (
            select 1
              from daily_edition_cards dec
              join daily_editions de on de.id=dec.edition_id
             where dec.card_id=gc.id and de.status='published'
          )
        returning id`,
      [cardId, status]
    );
    if (result.rowCount === 0) throw new Error(`Card ${cardId} cannot be moved to ${status}`);
  }

  async setEditionStatus(
    editionDate: string,
    status: Extract<EditionStatus, "reviewed" | "published">
  ): Promise<DailyEditionRecord> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const locked = await client.query(
        "select id, status from daily_editions where edition_date=$1 for update",
        [editionDate]
      );
      if (locked.rowCount === 0) throw new Error(`Edition ${editionDate} not found`);
      const editionId = String(locked.rows[0].id);
      const current = String(locked.rows[0].status);

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
      await client.query("commit");
      const edition = await this.getEdition(editionDate);
      if (!edition) throw new Error(`Edition ${editionDate} disappeared after update`);
      return edition;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  private async upsertArticle(client: PoolClient, candidate: ArticleCandidate): Promise<string> {
    const source = await client.query(
      `insert into sources (source_key, name)
       values ($1,$2)
       on conflict (source_key) do update set name=excluded.name, updated_at=now()
       returning id`,
      [sourceKey(candidate.sourceName), candidate.sourceName]
    );
    const result = await client.query(
      `insert into articles
         (external_id, source_id, source_name, source_url, canonical_url, title, summary,
          published_at, language, country)
       values ($1,$2,$3,$4,$4,$5,$6,$7,$8,$9)
       on conflict (external_id) do update set
         source_id=excluded.source_id, source_name=excluded.source_name, source_url=excluded.source_url,
         title=excluded.title, summary=excluded.summary, published_at=excluded.published_at,
         language=excluded.language, country=excluded.country, last_seen_at=now()
       returning id`,
      [candidate.id, source.rows[0].id, candidate.sourceName, candidate.sourceUrl, candidate.title,
       candidate.summary ?? null, candidate.publishedAt ?? null, candidate.language ?? null, candidate.country ?? null]
    );
    return String(result.rows[0].id);
  }
}
