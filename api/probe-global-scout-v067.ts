import type { VercelRequest, VercelResponse } from "@vercel/node";
import { collect } from "../src/ingest/collect.js";
import { selectScoutCandidates } from "../src/pipeline/daily.js";
import { preScoutPlayability } from "../src/pipeline/playability.js";
import { OpenAIScout } from "../src/ai/scout.js";

const PROBE_NONCE = "v067-4c8e2a7f91bd";

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

  const mode = String(req.query.mode ?? "status");
  if (mode === "status") {
    return res.status(200).json({
      ok: true,
      preview: true,
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
      scoutModel: process.env.OPENAI_SCOUT_MODEL ?? "gpt-5.6-luna"
    });
  }

  if (mode !== "run") {
    return res.status(400).json({ error: "invalid_mode" });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "openai_not_configured" });
  }

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
}
