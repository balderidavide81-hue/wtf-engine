import type { VercelRequest, VercelResponse } from "@vercel/node";
import { NeonContentStore } from "../src/store/neon-content-store.js";
import { validateCardDraft } from "../src/ai/editor.js";
import {
  DAILY_GENERATION_LEASE_KEY,
  DAILY_GENERATION_LEASE_TTL_SECONDS
} from "../src/store/lease-constants.js";

const NONCE = "v0620-review-draft-8c3e51a7d2f4";
const PROBE_LEASE = "probe:v0620:review-draft:2026-09-23";
const EDITION_DATE = "2026-09-23";
const EXPIRES_AT = Date.parse("2026-09-23T20:15:00Z");

const revisions = [
  {
    cardId: "975a23e0-d461-499d-88a0-9ddf401a96bc",
    hook: "Un piccolo gregge è scappato dal recinto e ha deciso di esplorare il vicinato.",
    question: "Dove sono andate le pecore fuggite dal recinto?",
    options: [
      "In un parco acquatico",
      "In una stazione ferroviaria",
      "In un nuovo liceo vicino",
      "In un supermercato"
    ],
    correctOptionIndex: 2,
    reveal: "Un gregge di pecore è fuggito dal recinto e ha raggiunto un liceo vicino, dove un testimone ha scattato delle foto.",
    resolutionRule: null
  },
  {
    cardId: "f5794513-0b4a-4a34-99ae-deeaae2e492e",
    hook: "Una nuova specie di serpente della Nuova Guinea ha ricevuto un nome decisamente rock.",
    question: "A quale musicista è stata dedicata la nuova specie di serpente?",
    options: ["Brian May", "Iggy Pop", "Slash", "Ozzy Osbourne"],
    correctOptionIndex: 2,
    reveal: "Il serpente Lielaphis slashi è stato chiamato così in onore di Slash, chitarrista dei Guns N’ Roses, appassionato di rettili fin dall’infanzia.",
    resolutionRule: null
  },
  {
    cardId: "6cfc3d5e-f3d6-4c76-8b90-7213050033ba",
    hook: "In Bolivia, una scoperta felina ha riaperto una pagina della storia naturale che sembrava chiusa da decenni.",
    question: "Gli scienziati hanno scoperto in Bolivia una nuova specie di gatto selvatico, la prima identificata da oltre un secolo.",
    options: ["Vero", "Falso"],
    correctOptionIndex: 0,
    reveal: "Gli scienziati hanno identificato in Bolivia una nuova specie di gatto selvatico, la prima riconosciuta in oltre un secolo.",
    resolutionRule: null
  }
] as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (process.env.VERCEL_ENV !== "production") return res.status(404).json({ error: "not_found" });
  if (Date.now() >= EXPIRES_AT) return res.status(410).json({ error: "probe_expired" });
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (String(req.query.nonce ?? "") !== NONCE) return res.status(401).json({ error: "unauthorized" });
  if (!process.env.DATABASE_URL) return res.status(503).json({ error: "persistence_not_configured" });

  const store = new NeonContentStore();
  const before = await store.getEditorialEdition(EDITION_DATE);
  if (!before) return res.status(404).json({ error: "edition_not_found" });

  if (before.status === "reviewed") {
    return res.status(200).json({
      ok: true,
      alreadyReviewed: true,
      editionDate: before.editionDate,
      status: before.status,
      cardCount: before.cards.length,
      reviewedCards: before.cards.filter(card => card.lifecycleStatus === "reviewed").length
    });
  }
  if (before.status !== "draft") {
    return res.status(409).json({ error: "edition_not_draft", status: before.status });
  }
  if (before.cards.length !== 15) {
    return res.status(409).json({ error: "unexpected_card_count", count: before.cards.length });
  }

  const knownIds = new Set(before.cards.map(card => card.id));
  const missingRevisionCards = revisions.filter(revision => !knownIds.has(revision.cardId));
  if (missingRevisionCards.length > 0) {
    return res.status(409).json({
      error: "revision_card_missing",
      cardIds: missingRevisionCards.map(revision => revision.cardId)
    });
  }

  const probeOwner = await store.tryAcquireGenerationLease(PROBE_LEASE, 3600);
  if (!probeOwner) return res.status(409).json({ error: "probe_already_running_or_consumed" });

  let dailyOwner: string | null = null;
  try {
    dailyOwner = await store.tryAcquireGenerationLease(
      DAILY_GENERATION_LEASE_KEY,
      DAILY_GENERATION_LEASE_TTL_SECONDS
    );
    if (!dailyOwner) return res.status(409).json({ error: "generation_in_progress" });

    for (const revision of revisions) {
      const current = before.cards.find(card => card.id === revision.cardId);
      if (!current) throw new Error(`Card ${revision.cardId} disappeared before edit`);
      validateCardDraft({
        articleId: current.articleId,
        mode: current.mode,
        interactionType: current.interactionType,
        category: current.category,
        hook: revision.hook,
        question: revision.question,
        options: [...revision.options],
        correctOptionIndex: revision.correctOptionIndex,
        reveal: revision.reveal,
        resolutionRule: revision.resolutionRule
      });
      await store.updateDraftCard(EDITION_DATE, revision.cardId, {
        hook: revision.hook,
        question: revision.question,
        options: [...revision.options],
        correctOptionIndex: revision.correctOptionIndex,
        reveal: revision.reveal,
        resolutionRule: revision.resolutionRule
      });
    }

    const edited = await store.getEditorialEdition(EDITION_DATE);
    if (!edited || edited.status !== "draft" || edited.cards.length !== 15) {
      throw new Error("Draft edition could not be read back after edits");
    }
    for (const card of edited.cards) {
      validateCardDraft({
        articleId: card.articleId,
        mode: card.mode,
        interactionType: card.interactionType,
        category: card.category,
        hook: card.hook,
        question: card.question,
        options: card.options,
        correctOptionIndex: card.correctOptionIndex,
        reveal: card.reveal,
        resolutionRule: card.resolutionRule
      });
    }

    for (const card of edited.cards) {
      await store.setCardLifecycle(EDITION_DATE, card.id, "reviewed");
    }
    await store.setEditionStatus(EDITION_DATE, "reviewed");

    const after = await store.getEditorialEdition(EDITION_DATE);
    if (!after || after.status !== "reviewed") throw new Error("Edition did not enter reviewed state");
    const reviewedCards = after.cards.filter(card => card.lifecycleStatus === "reviewed").length;
    if (reviewedCards !== after.cards.length) {
      throw new Error(`Reviewed-card mismatch: ${reviewedCards}/${after.cards.length}`);
    }

    const summary = {
      ok: true,
      alreadyReviewed: false,
      editionDate: after.editionDate,
      status: after.status,
      cardCount: after.cards.length,
      reviewedCards,
      editedCardIds: revisions.map(revision => revision.cardId)
    };
    console.log("editorial_review_v0620_summary", JSON.stringify(summary));
    return res.status(200).json(summary);
  } catch (error) {
    console.error("editorial_review_v0620_failed", error);
    return res.status(500).json({
      error: "editorial_review_v0620_failed",
      message: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (dailyOwner) {
      try {
        await store.releaseGenerationLease(DAILY_GENERATION_LEASE_KEY, dailyOwner);
      } catch (releaseError) {
        console.error("editorial_review_v0620_daily_lease_release_failed", releaseError);
      }
    }
  }
}
