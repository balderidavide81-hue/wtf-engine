import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OpenAIScout, SCOUT_BATCH_LIMIT } from "../src/ai/scout.js";
import type { ArticleCandidate } from "../src/domain/types.js";
import { hasBearerSecret } from "../src/auth/bearer.js";
import { isHttpUrl } from "../src/domain/url.js";

const MAX_FIELD_CHARS = 12_000;
const MAX_BATCH_CHARS = 120_000;

function isCandidate(value: unknown): value is ArticleCandidate {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return typeof c.id === "string"
    && c.id.trim().length > 0
    && typeof c.sourceName === "string"
    && c.sourceName.trim().length > 0
    && typeof c.sourceUrl === "string"
    && isHttpUrl(c.sourceUrl)
    && typeof c.title === "string"
    && c.title.trim().length > 0
    && c.id.length <= MAX_FIELD_CHARS
    && c.sourceName.length <= MAX_FIELD_CHARS
    && c.sourceUrl.length <= MAX_FIELD_CHARS
    && c.title.length <= MAX_FIELD_CHARS
    && (c.summary === undefined || (typeof c.summary === "string" && c.summary.length <= MAX_FIELD_CHARS))
    && (c.body === undefined || (typeof c.body === "string" && c.body.length <= MAX_FIELD_CHARS))
    && (c.publishedAt === undefined || (typeof c.publishedAt === "string" && c.publishedAt.length <= MAX_FIELD_CHARS))
    && (c.language === undefined || (typeof c.language === "string" && c.language.length <= MAX_FIELD_CHARS))
    && (c.country === undefined || (typeof c.country === "string" && c.country.length <= MAX_FIELD_CHARS));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (!hasBearerSecret(req, process.env.GENERATION_API_TOKEN)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const candidates = (req.body as { candidates?: unknown } | undefined)?.candidates;
  if (!Array.isArray(candidates) || !candidates.every(isCandidate)) {
    return res.status(400).json({ error: "invalid_candidates" });
  }
  if (candidates.length === 0 || candidates.length > SCOUT_BATCH_LIMIT) {
    return res.status(400).json({ error: "batch_size", min: 1, max: SCOUT_BATCH_LIMIT });
  }
  const batchChars = candidates.reduce((total, candidate) => total + JSON.stringify(candidate).length, 0);
  if (batchChars > MAX_BATCH_CHARS) {
    return res.status(413).json({ error: "batch_too_large", maxChars: MAX_BATCH_CHARS });
  }

  try {
    const scout = new OpenAIScout();
    const batch = await scout.classifyDetailed(candidates);
    return res.status(200).json({
      model: batch.usage.model,
      count: batch.results.length,
      usage: batch.usage,
      results: batch.results
    });
  } catch (error) {
    console.error("scout_failed", error);
    return res.status(500).json({
      error: "scout_failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
