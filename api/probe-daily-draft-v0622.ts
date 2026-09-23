import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Pool } from "@neondatabase/serverless";
import { buildDailyQueue } from "../src/pipeline/daily.js";
import { NeonContentStore } from "../src/store/neon-content-store.js";
import { editionDateFor } from "../src/time/edition-date.js";
import {
  DAILY_GENERATION_LEASE_KEY,
  DAILY_GENERATION_LEASE_TTL_SECONDS
} from "../src/store/lease-constants.js";

const PROBE_NONCE = "v0622-first-draft-41e8c7a2d593";
const PROBE_LEASE = "probe:v0622:first-persisted-draft:2026-09-23";
const OLD_TARGETED_PROBE_LEASE = "probe:v0618:targeted-editor:2026-09-22";
const PROBE_EXPIRES_AT = Date.parse("2026-09-23T21:30:00Z");

const REQUIRED_TABLES = [
  "sources",
  "articles",
  "pipeline_runs",
  "scout_results",
  "game_cards",
  "daily_editions",
  "daily_edition_cards",
  "generation_leases"
] as const;

async function verifyPersistenceSchema(connectionString: string): Promise<{
  tables: Record<string, boolean>;
  pgTrgm: boolean;
}> {
  const pool = new Pool({ connectionString });
  try {
    const tableChecks = REQUIRED_TABLES.map((_, index) => `to_regclass($${index + 1}) is not null as t${index}`);
    const result = await pool.query(
      `select ${tableChecks.join(", ")},
              exists(select 1 from pg_extension where extname='pg_trgm') as pg_trgm`,
      REQUIRED_TABLES.map(table => `public.${table}`)
    );
    const row = result.rows[0] ?? {};
    return {
      tables: Object.fromEntries(REQUIRED_TABLES.map((table, index) => [table, Boolean(row[`t${index}`])])),
      pgTrgm: Boolean(row.pg_trgm)
    };
  } finally {
    await pool.end();
  }
}

async function sealLease(connectionString: string, leaseKey: string): Promise<void> {
  const pool = new Pool({ connectionString });
  try {
    await pool.query(
      "update generation_leases set expires_at='2099-01-01T00:00:00Z' where lease_key=$1",
      [leaseKey]
    );
  } finally {
    await pool.end();
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (process.env.VERCEL_ENV !== "production") return res.status(404).json({ error: "not_found" });
  if (Date.now() >= PROBE_EXPIRES_AT) return res.status(410).json({ error: "probe_expired" });
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (String(req.query.nonce ?? "") !== PROBE_NONCE) return res.status(401).json({ error: "unauthorized" });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "openai_not_configured" });
  if (!process.env.DATABASE_URL) return res.status(503).json({ error: "persistence_not_configured" });

  const connectionString = process.env.DATABASE_URL;
  const schema = await verifyPersistenceSchema(connectionString);
  const missingTables = Object.entries(schema.tables).filter(([, present]) => !present).map(([table]) => table);
  if (missingTables.length > 0 || !schema.pgTrgm) {
    return res.status(503).json({
      error: "persistence_schema_not_ready",
      missingTables,
      pgTrgm: schema.pgTrgm
    });
  }

  const store = new NeonContentStore(connectionString);
  const editionDate = editionDateFor();
  const before = await store.getEdition(editionDate);
  if (before && before.status !== "draft") {
    return res.status(409).json({
      error: "edition_generation_closed",
      editionDate,
      status: before.status
    });
  }

  // Neutralize the old public-history regression probe before any new paid work.
  await sealLease(connectionString, OLD_TARGETED_PROBE_LEASE);

  const probeOwner = await store.tryAcquireGenerationLease(PROBE_LEASE, 3600);
  if (!probeOwner) return res.status(409).json({ error: "probe_already_consumed" });

  let dailyOwner: string | null = null;
  try {
    dailyOwner = await store.tryAcquireGenerationLease(
      DAILY_GENERATION_LEASE_KEY,
      DAILY_GENERATION_LEASE_TTL_SECONDS
    );
    if (!dailyOwner) return res.status(409).json({ error: "generation_already_running" });

    console.log("daily_draft_v0622_start", JSON.stringify({
      editionDate,
      beforeStatus: before?.status ?? null,
      beforeCardCount: before?.cardIds.length ?? 0,
      limit: 30,
      expiresAt: new Date(PROBE_EXPIRES_AT).toISOString(),
      schema
    }));

    const report = await buildDailyQueue(30, store);
    if (!report.persistence) throw new Error("Daily draft run completed without persistence");
    if (report.scoutOmittedArticleIds.length > 0) {
      throw new Error("Scout omitted submitted candidates: " + report.scoutOmittedArticleIds.join(", "));
    }
    if (report.editorOmittedArticleIds.length > 0) {
      throw new Error("Editor omitted submitted candidates: " + report.editorOmittedArticleIds.join(", "));
    }
    if (report.editorSubmitted !== report.editorEligible || report.edited !== report.editorEligible) {
      throw new Error(
        `Editor completeness mismatch eligible=${report.editorEligible} submitted=${report.editorSubmitted} edited=${report.edited}`
      );
    }

    const edition = await store.getEditorialEdition(report.persistence.editionDate);
    if (!edition) throw new Error("Persisted draft edition could not be read back");
    if (edition.status !== "draft") {
      throw new Error(`Persisted edition unexpectedly has status ${edition.status}`);
    }
    if (edition.cards.length === 0) {
      throw new Error("Persisted draft edition contains no cards");
    }

    const summary = {
      editionDate: report.persistence.editionDate,
      editionId: report.persistence.editionId ?? null,
      editionStatus: edition.status,
      editionCardCount: edition.cards.length,
      beforeCardCount: before?.cardIds.length ?? 0,
      newCardCount: report.persistence.newCardIds.length,
      totalEditionCardCount: report.persistence.editionCardIds.length,
      scouted: report.scouted,
      editorEligible: report.editorEligible,
      editorSubmitted: report.editorSubmitted,
      edited: report.edited,
      scoutOmitted: report.scoutOmittedArticleIds.length,
      editorOmitted: report.editorOmittedArticleIds.length,
      previouslyProcessed: report.previouslyProcessed,
      previouslyKnownStories: report.previouslyKnownStories,
      ai: report.ai
    };

    console.log("daily_draft_v0622_summary", JSON.stringify(summary));
    console.log("daily_draft_v0622_cards", JSON.stringify(
      edition.cards.map(card => ({
        id: card.id,
        articleId: card.articleId,
        lifecycleStatus: card.lifecycleStatus,
        mode: card.mode,
        interactionType: card.interactionType,
        category: card.category,
        sourceName: card.sourceName,
        title: card.title,
        hook: card.hook,
        question: card.question
      }))
    ));

    return res.status(200).json(summary);
  } catch (error) {
    console.error("daily_draft_v0622_failed", error);
    return res.status(500).json({
      error: "daily_draft_v0622_failed",
      message: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (dailyOwner) {
      try {
        await store.releaseGenerationLease(DAILY_GENERATION_LEASE_KEY, dailyOwner);
      } catch (releaseError) {
        console.error("daily_draft_v0622_release_failed", releaseError);
      }
    }
    try {
      await sealLease(connectionString, PROBE_LEASE);
    } catch (sealError) {
      console.error("daily_draft_v0622_seal_failed", sealError);
    }
  }
}
