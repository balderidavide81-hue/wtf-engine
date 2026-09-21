import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildDailyQueue } from "../src/pipeline/daily.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const requested = Number(req.query.limit ?? 30);
  const limit = Number.isFinite(requested) ? Math.max(1, Math.min(Math.trunc(requested), 30)) : 30;

  try {
    const report = await buildDailyQueue(limit);
    return res.status(200).json(report);
  } catch (error) {
    console.error("daily_queue_failed", error);
    return res.status(500).json({
      error: "daily_queue_failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
