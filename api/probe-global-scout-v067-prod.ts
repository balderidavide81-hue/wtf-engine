import type { VercelRequest, VercelResponse } from "@vercel/node";
import { collect } from "../src/ingest/collect.js";
import { selectScoutCandidates } from "../src/pipeline/daily.js";
import { preScoutPlayability } from "../src/pipeline/playability.js";
import { OpenAIScout } from "../src/ai/scout.js";
import { NeonContentStore } from "../src/store/neon-content-store.js";

const PROBE_NONCE = "prod-v068-31af72c9d5e4";
const PROBE_LEASE = "probe:v068:global-scout:2026-09-22";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (process.env.VERCEL_ENV !== "production") {
    return res.status(404).json({ error: "not_found" });
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (String(req.query.nonce ?? "") !== PROBE_NONCE) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "openai_not_configured" });
  }
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "persistence_not_configured" });
  }

  const store = new NeonContentStore();
  const owner = await store.tryAcquireGenerationLease(PROBE_LEASE, 3600);
  if (!owner) {
    return res.status(409).json({ error: "probe_already_consumed" });
  }

  try {
    const collection = await collect();
    const selected = selectScoutCandidates(collection.candidates, 30);
    const byId = new Map(selected.map(candidate => [candidate.id, candidate]));
    const batch = await new OpenAIScout().classifyDetailed(selected);

    return res.status(200).json({
      collection: {
        sourceCount: collection.sourceCount,
        fetched: collection.fetched,
        kept: collection.kept,
        errors: collection.errors
      },
      selection: {
        count: selected.length,
        languages: selected.reduce<Record<string, number>>((acc, candidate) => {
          const key = candidate.language ?? "UNKNOWN";
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {}),
        sourceCountries: selected.reduce<Record<string, number>>((acc, candidate) => {
          const key = candidate.sourceCountry ?? candidate.country ?? "UNKNOWN";
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {})
      },
      usage: batch.usage,
      results: batch.results.map(result => {
        const candidate = byId.get(result.articleId);
        const playability = candidate ? preScoutPlayability(candidate) : null;
        return {
          ...result,
          title: candidate?.title ?? null,
          summary: candidate?.summary ?? null,
          language: candidate?.language ?? null,
          sourceName: candidate?.sourceName ?? null,
          sourceCountry: candidate?.sourceCountry ?? candidate?.country ?? null,
          eventCountry: candidate?.eventCountry ?? null,
          eventLocation: candidate?.eventLocation ?? null,
          preScoutScore: playability?.score ?? null,
          preScoutPositiveSignals: playability?.positiveSignals ?? [],
          preScoutNegativeSignals: playability?.negativeSignals ?? []
        };
      })
    });
  } catch (error) {
    console.error("global_scout_probe_failed", error);
    return res.status(500).json({
      error: "global_scout_probe_failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
