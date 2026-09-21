import type { VercelRequest, VercelResponse } from "@vercel/node";
import { NeonContentStore } from "../src/store/neon-content-store.js";
import { editionDateFromQuery } from "../src/time/edition-date.js";
import { isEditorialAuthorized } from "../src/auth/editorial.js";
import { DAILY_GENERATION_LEASE_KEY, DAILY_GENERATION_LEASE_TTL_SECONDS } from "../src/store/lease-constants.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (!isEditorialAuthorized(req)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const date = editionDateFromQuery(req.query.date);
  if (!date) return res.status(400).json({ error: "invalid_edition_date" });
  if (!process.env.DATABASE_URL) return res.status(503).json({ error: "persistence_not_configured" });

  try {
    const contentStore = new NeonContentStore();
    if (req.method === "GET") {
      const edition = await contentStore.getEditorialEdition(date);
      return edition ? res.status(200).json(edition) : res.status(404).json({ error: "edition_not_found" });
    }

    if (req.method === "POST") {
      const action = req.body?.action;
      if (action === "review_card" || action === "reject_card") {
        if (typeof req.body?.cardId !== "string") return res.status(400).json({ error: "card_id_required" });
        await contentStore.setCardLifecycle(date, req.body.cardId, action === "review_card" ? "reviewed" : "rejected");
        return res.status(200).json({ ok: true });
      }
      if (action === "resolve_prediction") {
        if (typeof req.body?.cardId !== "string") return res.status(400).json({ error: "card_id_required" });
        if (!Number.isInteger(req.body?.outcomeOptionIndex)) {
          return res.status(400).json({ error: "outcome_option_index_required" });
        }
        if (typeof req.body?.evidenceUrl !== "string" || !req.body.evidenceUrl.trim()) {
          return res.status(400).json({ error: "evidence_url_required" });
        }
        if (typeof req.body?.evidenceNote !== "string" || !req.body.evidenceNote.trim()) {
          return res.status(400).json({ error: "evidence_note_required" });
        }
        await contentStore.resolvePrediction(req.body.cardId, {
          outcomeOptionIndex: req.body.outcomeOptionIndex,
          evidenceUrl: req.body.evidenceUrl.trim(),
          evidenceNote: req.body.evidenceNote.trim()
        });
        return res.status(200).json({ ok: true });
      }
      if (action === "void_prediction") {
        if (typeof req.body?.cardId !== "string") return res.status(400).json({ error: "card_id_required" });
        if (typeof req.body?.reason !== "string" || !req.body.reason.trim()) {
          return res.status(400).json({ error: "void_reason_required" });
        }
        if (req.body?.evidenceUrl !== undefined && typeof req.body.evidenceUrl !== "string") {
          return res.status(400).json({ error: "invalid_evidence_url" });
        }
        await contentStore.voidPrediction(req.body.cardId, {
          reason: req.body.reason.trim(),
          ...(typeof req.body.evidenceUrl === "string" && req.body.evidenceUrl.trim()
            ? { evidenceUrl: req.body.evidenceUrl.trim() }
            : {})
        });
        return res.status(200).json({ ok: true });
      }
      if (action === "review_edition" || action === "publish_edition") {
        const leaseOwner = await contentStore.tryAcquireGenerationLease(
          DAILY_GENERATION_LEASE_KEY,
          DAILY_GENERATION_LEASE_TTL_SECONDS
        );
        if (!leaseOwner) return res.status(409).json({ error: "generation_in_progress" });
        try {
          const edition = await contentStore.setEditionStatus(
            date,
            action === "review_edition" ? "reviewed" : "published"
          );
          return res.status(200).json(edition);
        } finally {
          try {
            await contentStore.releaseGenerationLease(DAILY_GENERATION_LEASE_KEY, leaseOwner);
          } catch (releaseError) {
            console.error("editorial_lease_release_failed", releaseError);
          }
        }
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
