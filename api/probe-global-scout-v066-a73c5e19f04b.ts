import type { VercelRequest, VercelResponse } from "@vercel/node";
import { collect } from "../src/ingest/collect.js";
import { selectScoutCandidates } from "../src/pipeline/daily.js";
import { OpenAIScout } from "../src/ai/scout.js";
import { NeonContentStore } from "../src/store/neon-content-store.js";

const PROBE_NONCE = "prod-v066-a73c5e19f04b";
const PROBE_LEASE_KEY = "probe:global-scout-v066-a73c5e19f04b";

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
  if (!process.env.OPENAI_API_KEY || !process.env.DATABASE_URL) {
    return res.status(503).json({ error: "probe_dependencies_not_configured" });
  }

  const store = new NeonContentStore();
  const lease = await store.tryAcquireGenerationLease(PROBE_LEASE_KEY, 3600);
  if (!lease) {
    return res.status(409).json({ error: "probe_already_consumed" });
  }

  try {
    const collection = await collect();
    const selected = selectScoutCandidates(collection.candidates, 30);
    if (selected.length !== 30) {
      return res.status(503).json({
        error: "insufficient_candidates",
        selected: selected.length,
        collection: { fetched: collection.fetched, kept: collection.kept, errors: collection.errors }
      });
    }

    const batch = await new OpenAIScout().classifyDetailed(selected);
    const byId = new Map(selected.map(candidate => [candidate.id, candidate]));

    return res.status(200).json({
      collection: {
        sourceCount: collection.sourceCount,
        fetched: collection.fetched,
        kept: collection.kept,
        errors: collection.errors
      },
      usage: batch.usage,
      selected: selected.map(candidate => ({
        id: candidate.id,
        sourceName: candidate.sourceName,
        title: candidate.title,
        language: candidate.language ?? null,
        sourceCountry: candidate.sourceCountry ?? candidate.country ?? null,
        eventCountry: candidate.eventCountry ?? null,
        eventLocation: candidate.eventLocation ?? null
      })),
      results: batch.results.map(result => {
        const candidate = byId.get(result.articleId);
        return {
          ...result,
          title: candidate?.title ?? null,
          language: candidate?.language ?? null,
          sourceName: candidate?.sourceName ?? null,
          sourceCountry: candidate?.sourceCountry ?? candidate?.country ?? null,
          eventCountry: candidate?.eventCountry ?? null,
          eventLocation: candidate?.eventLocation ?? null
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
