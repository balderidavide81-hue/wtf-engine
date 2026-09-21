import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OpenAIScout } from "../src/ai/scout.js";
import type { ArticleCandidate } from "../src/domain/types.js";

const MAX_BATCH = 30;

function isCandidate(value: unknown): value is ArticleCandidate {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return typeof c.id === "string"
    && typeof c.sourceName === "string"
    && typeof c.sourceUrl === "string"
    && typeof c.title === "string";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const candidates = (req.body as { candidates?: unknown } | undefined)?.candidates;
  if (!Array.isArray(candidates) || !candidates.every(isCandidate)) {
    return res.status(400).json({ error: "invalid_candidates" });
  }
  if (candidates.length === 0 || candidates.length > MAX_BATCH) {
    return res.status(400).json({ error: "batch_size", min: 1, max: MAX_BATCH });
  }

  try {
    const scout = new OpenAIScout();
    const results = await scout.classify(candidates);
    return res.status(200).json({
      model: process.env.OPENAI_SCOUT_MODEL ?? "gpt-5.6-luna",
      count: results.length,
      results
    });
  } catch (error) {
    console.error("scout_failed", error);
    return res.status(500).json({
      error: "scout_failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
