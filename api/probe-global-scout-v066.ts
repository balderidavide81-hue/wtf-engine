import type { VercelRequest, VercelResponse } from "@vercel/node";
import { collect } from "../src/ingest/collect.js";
import { selectScoutCandidates } from "../src/pipeline/daily.js";
import { OpenAIScout } from "../src/ai/scout.js";

const PROBE_NONCE = "v066-7f3c91b8d4a2";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (process.env.VERCEL_ENV !== "preview") {
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

  const collection = await collect();
  const selected = selectScoutCandidates(collection.candidates, 30);
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
}
