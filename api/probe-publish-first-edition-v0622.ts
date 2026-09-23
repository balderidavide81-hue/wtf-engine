import type { VercelRequest, VercelResponse } from "@vercel/node";
import { NeonContentStore } from "../src/store/neon-content-store.js";
import {
  DAILY_GENERATION_LEASE_KEY,
  DAILY_GENERATION_LEASE_TTL_SECONDS
} from "../src/store/lease-constants.js";

const PROBE_NONCE = "v0622-publish-first-edition-73c9a1e5b246";
const PROBE_EXPIRES_AT = Date.parse("2026-09-23T21:30:00Z");
const EDITION_DATE = "2026-09-23";
const EXPECTED_CARD_COUNT = 15;

async function verifiedPublishedSummary(store: NeonContentStore, alreadyPublished: boolean) {
  const published = await store.getPublishedEdition(EDITION_DATE);
  if (!published) throw new Error("Published edition could not be read back");
  if (published.cards.length !== EXPECTED_CARD_COUNT) {
    throw new Error(
      `Published edition card count mismatch: expected ${EXPECTED_CARD_COUNT}, got ${published.cards.length}`
    );
  }

  const predictCards = published.cards.filter(card => card.mode === "PREDICT");
  const nonPredictCards = published.cards.filter(card => card.mode !== "PREDICT");
  const invalidPredict = predictCards.filter(card => card.status !== "open");
  const invalidNonPredict = nonPredictCards.filter(card => card.status !== "published");

  if (predictCards.length !== 1) {
    throw new Error(`Expected exactly one PREDICT card, got ${predictCards.length}`);
  }
  if (invalidPredict.length > 0 || invalidNonPredict.length > 0) {
    throw new Error("Published card lifecycle transition mismatch");
  }

  return {
    editionDate: published.editionDate,
    status: "published",
    alreadyPublished,
    cardCount: published.cards.length,
    predictOpen: predictCards.length,
    standardPublished: nonPredictCards.length,
    cards: published.cards.map(card => ({
      id: card.id,
      mode: card.mode,
      interactionType: card.interactionType,
      category: card.category,
      status: card.status,
      sourceName: card.sourceName,
      hook: card.hook,
      question: card.question,
      resolutionRule: card.resolutionRule
    }))
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (process.env.VERCEL_ENV !== "production") return res.status(404).json({ error: "not_found" });
  if (Date.now() >= PROBE_EXPIRES_AT) return res.status(410).json({ error: "probe_expired" });
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (String(req.query.nonce ?? "") !== PROBE_NONCE) return res.status(401).json({ error: "unauthorized" });
  if (!process.env.DATABASE_URL) return res.status(503).json({ error: "persistence_not_configured" });

  const store = new NeonContentStore();
  const edition = await store.getEditorialEdition(EDITION_DATE);
  if (!edition) return res.status(404).json({ error: "edition_not_found", editionDate: EDITION_DATE });

  if (edition.status === "published") {
    const summary = await verifiedPublishedSummary(store, true);
    console.log("first_edition_publish_v0622_summary", JSON.stringify(summary));
    return res.status(200).json(summary);
  }

  if (edition.status !== "reviewed") {
    return res.status(409).json({
      error: "edition_not_ready_for_publish",
      editionDate: EDITION_DATE,
      status: edition.status
    });
  }

  if (edition.cards.length !== EXPECTED_CARD_COUNT) {
    return res.status(409).json({
      error: "reviewed_card_count_mismatch",
      expected: EXPECTED_CARD_COUNT,
      actual: edition.cards.length
    });
  }

  const notReviewed = edition.cards.filter(card => card.lifecycleStatus !== "reviewed");
  if (notReviewed.length > 0) {
    return res.status(409).json({
      error: "cards_not_fully_reviewed",
      cardIds: notReviewed.map(card => card.id)
    });
  }

  const leaseOwner = await store.tryAcquireGenerationLease(
    DAILY_GENERATION_LEASE_KEY,
    DAILY_GENERATION_LEASE_TTL_SECONDS
  );
  if (!leaseOwner) return res.status(409).json({ error: "generation_in_progress" });

  try {
    console.log("first_edition_publish_v0622_start", JSON.stringify({
      editionDate: EDITION_DATE,
      cardCount: edition.cards.length,
      expiresAt: new Date(PROBE_EXPIRES_AT).toISOString()
    }));

    await store.setEditionStatus(EDITION_DATE, "published");
    const summary = await verifiedPublishedSummary(store, false);

    console.log("first_edition_publish_v0622_summary", JSON.stringify(summary));
    return res.status(200).json(summary);
  } catch (error) {
    console.error("first_edition_publish_v0622_failed", error);
    return res.status(500).json({
      error: "first_edition_publish_v0622_failed",
      message: error instanceof Error ? error.message : String(error)
    });
  } finally {
    try {
      await store.releaseGenerationLease(DAILY_GENERATION_LEASE_KEY, leaseOwner);
    } catch (releaseError) {
      console.error("first_edition_publish_v0622_release_failed", releaseError);
    }
  }
}
