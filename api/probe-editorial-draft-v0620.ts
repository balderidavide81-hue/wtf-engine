import type { VercelRequest, VercelResponse } from "@vercel/node";
import { NeonContentStore } from "../src/store/neon-content-store.js";

const PROBE_NONCE = "v0620-read-draft-4f91c7e2a6b3";
const EDITION_DATE = "2026-09-23";
const PROBE_EXPIRES_AT = Date.parse("2026-09-23T19:30:00Z");

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (process.env.VERCEL_ENV !== "production") return res.status(404).json({ error: "not_found" });
  if (Date.now() >= PROBE_EXPIRES_AT) return res.status(410).json({ error: "probe_expired" });
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (String(req.query.nonce ?? "") !== PROBE_NONCE) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (!process.env.DATABASE_URL) return res.status(503).json({ error: "persistence_not_configured" });

  try {
    const edition = await new NeonContentStore().getEditorialEdition(EDITION_DATE);
    if (!edition) return res.status(404).json({ error: "edition_not_found", date: EDITION_DATE });

    console.log("editorial_draft_v0620_summary", JSON.stringify({
      editionId: edition.id,
      editionDate: edition.editionDate,
      status: edition.status,
      cardCount: edition.cards.length,
      lifecycle: edition.cards.reduce<Record<string, number>>((acc, card) => {
        acc[card.lifecycleStatus] = (acc[card.lifecycleStatus] ?? 0) + 1;
        return acc;
      }, {})
    }));

    return res.status(200).json(edition);
  } catch (error) {
    console.error("editorial_draft_v0620_failed", error);
    return res.status(500).json({
      error: "editorial_draft_v0620_failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
