import { Pool, type PoolClient } from "@neondatabase/serverless";
import type { ArticleCandidate, ScoutResult } from "../domain/types.js";
import type { GameCardDraft } from "../ai/editor.js";
import type { ContentStore } from "./content-store.js";
import type { DailyEditionRecord, PersistedPipelineRun } from "./types.js";

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

  async saveDraftEdition(editionDate: string, cardIds: string[]): Promise<DailyEditionRecord> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await client.query(
        `insert into daily_editions (edition_date, status)
         values ($1, 'draft')
         on conflict (edition_date) do update set status='draft', published_at=null
         returning id, edition_date::text, status`,
        [editionDate]
      );
      const editionId = String(result.rows[0].id);
      await client.query("delete from daily_edition_cards where edition_id=$1", [editionId]);
      for (let position = 0; position < cardIds.length; position++) {
        await client.query(
          "insert into daily_edition_cards (edition_id, card_id, position) values ($1,$2,$3)",
          [editionId, cardIds[position], position]
        );
      }
      await client.query("commit");
      return { id: editionId, editionDate: String(result.rows[0].edition_date), status: "draft", cardIds };
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
