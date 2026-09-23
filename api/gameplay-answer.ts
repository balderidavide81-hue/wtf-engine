import type { VercelRequest, VercelResponse } from "@vercel/node";
import { NeonContentStore } from "../src/store/neon-content-store.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "persistence_not_configured" });
  }

  const cardId = typeof req.body?.cardId === "string" ? req.body.cardId.trim() : "";
  const selectedOptionIndex = req.body?.selectedOptionIndex;
  if (!cardId) return res.status(400).json({ error: "card_id_required" });
  if (!Number.isInteger(selectedOptionIndex) || selectedOptionIndex < 0) {
    return res.status(400).json({ error: "selected_option_index_required" });
  }

  try {
    const result = await new NeonContentStore().answerPublishedCard(cardId, selectedOptionIndex);
    if (!result) return res.status(404).json({ error: "answerable_published_card_not_found" });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof RangeError) {
      return res.status(400).json({
        error: "invalid_selected_option_index",
        message: error.message
      });
    }
    console.error("gameplay_answer_failed", error);
    return res.status(500).json({ error: "gameplay_answer_failed" });
  }
}
