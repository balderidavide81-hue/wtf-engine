import type { VercelRequest, VercelResponse } from "@vercel/node";
import { NeonContentStore } from "../src/store/neon-content-store.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "persistence_not_configured" });
  }

  const requested = Number(req.query.limit ?? 30);
  const limit = Number.isFinite(requested)
    ? Math.max(1, Math.min(Math.trunc(requested), 50))
    : 30;

  const rawBefore = req.query.before;
  const before = typeof rawBefore === "string" && rawBefore.trim()
    ? rawBefore.trim()
    : undefined;
  if (before && Number.isNaN(Date.parse(before))) {
    return res.status(400).json({ error: "invalid_before" });
  }

  try {
    const feed = await new NeonContentStore().getPublishedFeed(limit, before);
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
    return res.status(200).json(feed);
  } catch (error) {
    console.error("gameplay_feed_failed", error);
    return res.status(500).json({ error: "gameplay_feed_failed" });
  }
}
