import type { VercelRequest, VercelResponse } from "@vercel/node";
import { NeonContentStore } from "../src/store/neon-content-store.js";
import { isEditorialAuthorized } from "../src/auth/editorial.js";

function store(): NeonContentStore {
  return new NeonContentStore();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isEditorialAuthorized(req)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const date = typeof req.query.date === "string" ? req.query.date : new Date().toISOString().slice(0, 10);
  try {
    if (req.method === "GET") {
      const edition = await store().getEditorialEdition(date);
      return edition ? res.status(200).json(edition) : res.status(404).json({ error: "edition_not_found" });
    }

    if (req.method === "POST") {
      const action = req.body?.action;
      if (action === "review_card" || action === "reject_card") {
        if (typeof req.body?.cardId !== "string") return res.status(400).json({ error: "card_id_required" });
        await store().setCardLifecycle(req.body.cardId, action === "review_card" ? "reviewed" : "rejected");
        return res.status(200).json({ ok: true });
      }
      if (action === "resolve_prediction") {
        if (typeof req.body?.cardId !== "string") return res.status(400).json({ error: "card_id_required" });
        await store().resolvePrediction(req.body.cardId, {
          outcomeOptionIndex: req.body?.outcomeOptionIndex,
          evidenceUrl: req.body?.evidenceUrl,
          evidenceNote: req.body?.evidenceNote
        });
        return res.status(200).json({ ok: true });
      }
      if (action === "void_prediction") {
        if (typeof req.body?.cardId !== "string") return res.status(400).json({ error: "card_id_required" });
        await store().voidPrediction(req.body.cardId, {
          reason: req.body?.reason ?? "",
          evidenceUrl: req.body?.evidenceUrl
        });
        return res.status(200).json({ ok: true });
      }
      if (action === "review_edition" || action === "publish_edition") {
        const edition = await store().setEditionStatus(date, action === "review_edition" ? "reviewed" : "published");
        return res.status(200).json(edition);
      }
      return res.status(400).json({ error: "unsupported_action" });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    console.error("editorial_api_failed", error);
    return res.status(409).json({
      error: "editorial_transition_failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
