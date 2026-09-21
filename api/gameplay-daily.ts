import type { VercelRequest, VercelResponse } from "@vercel/node";
import { NeonContentStore } from "../src/store/neon-content-store.js";
import { editionDateFromQuery } from "../src/time/edition-date.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const date = editionDateFromQuery(req.query.date);
  if (!date) return res.status(400).json({ error: "invalid_edition_date" });
  try {
    const edition = await new NeonContentStore().getPublishedEdition(date);
    if (!edition) return res.status(404).json({ error: "published_edition_not_found" });
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json(edition);
  } catch (error) {
    console.error("gameplay_daily_failed", error);
    return res.status(500).json({ error: "gameplay_daily_failed" });
  }
}
