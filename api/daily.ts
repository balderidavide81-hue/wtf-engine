import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildDailyQueue } from "../src/pipeline/daily.js";
import { NeonContentStore } from "../src/store/neon-content-store.js";
import { hasBearerSecret } from "../src/auth/bearer.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (!hasBearerSecret(req, process.env.GENERATION_API_TOKEN)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const requested = Number(req.query.limit ?? 30);
  const limit = Number.isFinite(requested) ? Math.max(1, Math.min(Math.trunc(requested), 30)) : 30;

  try {
    const store = process.env.DATABASE_URL ? new NeonContentStore() : undefined;
    const report = await buildDailyQueue(limit, store);
    return res.status(200).json(report);
  } catch (error) {
    console.error("daily_queue_failed", error);
    return res.status(500).json({
      error: "daily_queue_failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
