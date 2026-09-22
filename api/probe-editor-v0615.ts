import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { ScoutResult } from "../src/domain/types.js";
import { collect } from "../src/ingest/collect.js";
import { OpenAIEditor } from "../src/ai/editor.js";
import { NeonContentStore } from "../src/store/neon-content-store.js";

const PROBE_NONCE = "v0615-editor-keep-7f2c91d4e5a8";
const PROBE_LEASE = "probe:v0615:editor-keep:2026-09-22";

const capturedScout: ScoutResult[] = [
  {
    articleId: "upi-odd-news:https://www.upi.com/Odd_News/2026/09/21/emu-florida-polk-parkway/6991790000125/",
    decision: "KEEP", modes: ["WTF"],
    scores: { funny: 82, wtf: 88, shareability: 86, internationalAccessibility: 78, verifiability: 90, sensitivity: 5 },
    reason: "An emu in a highway passing lane is instantly visual, harmless and highly playable.",
    evidenceStatus: "SUPPORTED"
  },
  {
    articleId: "upi-odd-news:https://www.upi.com/Odd_News/2026/09/18/long-island-alligator-holtsville-ecology-center/8451789746179/",
    decision: "KEEP", modes: ["WTF"],
    scores: { funny: 78, wtf: 84, shareability: 82, internationalAccessibility: 77, verifiability: 88, sensitivity: 12 },
    reason: "An abandoned alligator wandering a New York preserve creates a clear, surprising rescue scenario.",
    evidenceStatus: "SUPPORTED"
  },
  {
    articleId: "upi-odd-news:https://www.upi.com/Odd_News/2026/09/17/santa-fe-parade-horse-chase/8301789655823/",
    decision: "KEEP", modes: ["WTF"],
    scores: { funny: 85, wtf: 86, shareability: 87, internationalAccessibility: 83, verifiability: 88, sensitivity: 8 },
    reason: "A parade horse fleeing into Santa Fe and requiring police and cowboys is excellent visual comedy.",
    evidenceStatus: "SUPPORTED"
  },
  {
    articleId: "upi-odd-news:https://www.upi.com/Odd_News/2026/09/21/Guinness-World-Records-David-Rush-flipping-cups/2671790001715/",
    decision: "KEEP", modes: ["WTF"],
    scores: { funny: 80, wtf: 83, shareability: 82, internationalAccessibility: 76, verifiability: 94, sensitivity: 2 },
    reason: "Flipping ten cups in 6.63 seconds is an unusually precise and easy-to-quiz record.",
    evidenceStatus: "SUPPORTED"
  },
  {
    articleId: "upi-odd-news:https://www.upi.com/Odd_News/2026/09/17/guinness-world-records-slim-jim/1191789667547/",
    decision: "KEEP", modes: ["WTF"],
    scores: { funny: 84, wtf: 86, shareability: 87, internationalAccessibility: 78, verifiability: 94, sensitivity: 3 },
    reason: "A 429-foot meat snack is absurdly tangible and offers a strong visual record challenge.",
    evidenceStatus: "SUPPORTED"
  },
  {
    articleId: "upi-odd-news:https://www.upi.com/Odd_News/2026/09/16/Guinness-World-Records-salt-and-pepper-packets/9321789579951/",
    decision: "KEEP", modes: ["WTF"],
    scores: { funny: 76, wtf: 78, shareability: 76, internationalAccessibility: 70, verifiability: 93, sensitivity: 2 },
    reason: "A record built around 754 matching salt-and-pepper packet pairs is quirky and measurable.",
    evidenceStatus: "SUPPORTED"
  },
  {
    articleId: "sciencedaily-strange-offbeat:https://www.sciencedaily.com/releases/2026/09/260917003712.htm",
    decision: "KEEP", modes: ["WTF"],
    scores: { funny: 35, wtf: 80, shareability: 70, internationalAccessibility: 72, verifiability: 86, sensitivity: 3 },
    reason: "A planet less than a million years old gives a strong, accessible ‘youngest ever’ discovery hook.",
    evidenceStatus: "SUPPORTED"
  },
  {
    articleId: "sciencedaily-strange-offbeat:https://www.sciencedaily.com/releases/2026/09/260919031033.htm",
    decision: "KEEP", modes: ["WTF"],
    scores: { funny: 72, wtf: 81, shareability: 82, internationalAccessibility: 78, verifiability: 78, sensitivity: 8 },
    reason: "Cats carrying chemical identity cards in urine is surprising, relatable and easy to frame as a quiz.",
    evidenceStatus: "SUPPORTED"
  },
  {
    articleId: "sciencedaily-strange-offbeat:https://www.sciencedaily.com/releases/2026/09/260918024816.htm",
    decision: "KEEP", modes: ["WTF"],
    scores: { funny: 80, wtf: 84, shareability: 86, internationalAccessibility: 78, verifiability: 87, sensitivity: 3 },
    reason: "A newly recognized snake named after Guns N’ Roses’ Slash combines celebrity and unusual biology.",
    evidenceStatus: "SUPPORTED"
  },
  {
    articleId: "smithsonian-smart-news:https://www.smithsonianmag.com/smart-news/three-wild-dogs-made-a-record-breaking-trek-across-zambia-traveling-more-than-2500-miles-in-search-of-mates-180989505/",
    decision: "KEEP", modes: ["WTF", "STORY"],
    scores: { funny: 50, wtf: 79, shareability: 75, internationalAccessibility: 72, verifiability: 85, sensitivity: 8 },
    reason: "Three wild dogs traveling over 2,500 miles in search of mates is an exceptional animal journey.",
    evidenceStatus: "SUPPORTED"
  },
  {
    articleId: "motor1-france-insolite:https://fr.motor1.com/news/786091/renault-5-1982-abandonnee-43-ans-retrouvee-encheres/",
    decision: "KEEP", modes: ["WTF", "PREDICT", "STORY"],
    scores: { funny: 72, wtf: 79, shareability: 78, internationalAccessibility: 72, verifiability: 82, sensitivity: 4 },
    reason: "A 43-year-old Renault with only 12 km is a strong time-capsule story with a pending auction outcome.",
    evidenceStatus: "SUPPORTED"
  },
  {
    articleId: "smithsonian-smart-news:https://www.smithsonianmag.com/smart-news/a-geologist-in-california-found-something-strange-sticking-out-of-a-creek-reverse-image-search-told-her-it-was-an-ancient-mastodon-tooth-180989504/",
    decision: "KEEP", modes: ["WTF"],
    scores: { funny: 45, wtf: 76, shareability: 75, internationalAccessibility: 78, verifiability: 86, sensitivity: 8 },
    reason: "Finding an Ice Age mastodon tooth through a creek and reverse-image search has a strong discovery arc.",
    evidenceStatus: "SUPPORTED"
  },
  {
    articleId: "smithsonian-smart-news:https://www.smithsonianmag.com/smart-news/princess-dianas-revenge-dress-is-heading-to-auction-for-the-first-time-in-nearly-30-years-180989492/",
    decision: "KEEP", modes: ["PREDICT", "STORY"],
    scores: { funny: 42, wtf: 70, shareability: 78, internationalAccessibility: 82, verifiability: 88, sensitivity: 28 },
    reason: "The famous dress returning to auction creates a clear, trackable event with strong cultural recognition.",
    evidenceStatus: "SUPPORTED"
  },
  {
    articleId: "insideevs-brasil-curiosidades:https://insideevs.uol.com.br/news/807205/noruega-ja-e-quase-eletrica/",
    decision: "KEEP", modes: ["WTF"],
    scores: { funny: 45, wtf: 75, shareability: 70, internationalAccessibility: 75, verifiability: 86, sensitivity: 2 },
    reason: "Norway recording 98.7% electric-car registrations and only 30 gasoline cars is a clear numerical surprise.",
    evidenceStatus: "SUPPORTED"
  },
  {
    articleId: "phys-org-plants-animals:https://phys.org/news/2026-09-bolivia-tilcayo-tiger-cat-wildcat.html",
    decision: "KEEP", modes: ["WTF", "STORY"],
    scores: { funny: 38, wtf: 78, shareability: 72, internationalAccessibility: 73, verifiability: 78, sensitivity: 6 },
    reason: "The first newly recognized wildcat species in a century is a strong rarity hook with follow-up potential.",
    evidenceStatus: "SUPPORTED"
  },
  {
    articleId: "phys-org-plants-animals:https://phys.org/news/2026-09-species-egg-snake-ethiopia-harenna.html",
    decision: "KEEP", modes: ["WTF"],
    scores: { funny: 55, wtf: 78, shareability: 70, internationalAccessibility: 68, verifiability: 82, sensitivity: 7 },
    reason: "A snake that exclusively eats birds’ eggs is distinctive, concrete and naturally quiz-friendly.",
    evidenceStatus: "SUPPORTED"
  }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (process.env.VERCEL_ENV !== "production") return res.status(404).json({ error: "not_found" });
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (String(req.query.nonce ?? "") !== PROBE_NONCE) return res.status(401).json({ error: "unauthorized" });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "openai_not_configured" });
  if (!process.env.DATABASE_URL) return res.status(503).json({ error: "persistence_not_configured" });

  const store = new NeonContentStore();
  const owner = await store.tryAcquireGenerationLease(PROBE_LEASE, 3600);
  if (!owner) return res.status(409).json({ error: "probe_already_consumed" });

  try {
    const collection = await collect();
    const byId = new Map(collection.candidates.map(candidate => [candidate.id, candidate]));
    const items = capturedScout.map(scout => ({ candidate: byId.get(scout.articleId), scout }));
    const missing = items.filter(item => !item.candidate).map(item => item.scout.articleId);
    if (missing.length) {
      console.error("editor_v0615_missing_candidates", JSON.stringify(missing));
      return res.status(409).json({ error: "captured_candidates_missing", missing });
    }

    const eligible = items.map(item => ({ candidate: item.candidate!, scout: item.scout }));
    const editor = new OpenAIEditor();
    const first = await editor.draft(eligible.slice(0, 12), 12);
    const second = await editor.draft(eligible.slice(12), 4);
    const cards = [...first.cards, ...second.cards];

    const submittedIds = new Set(eligible.map(item => item.candidate.id));
    const returnedIds = new Set(cards.map(card => card.articleId));
    const unexpected = cards.filter(card => !submittedIds.has(card.articleId)).map(card => card.articleId);
    const omitted = eligible.filter(item => !returnedIds.has(item.candidate.id)).map(item => item.candidate.id);
    if (unexpected.length) throw new Error("Editor returned unexpected article IDs: " + unexpected.join(", "));

    const totalUsage = {
      inputTokens: first.usage.inputTokens + second.usage.inputTokens,
      cachedInputTokens: first.usage.cachedInputTokens + second.usage.cachedInputTokens,
      outputTokens: first.usage.outputTokens + second.usage.outputTokens,
      totalTokens: first.usage.totalTokens + second.usage.totalTokens,
      estimatedCostUsd: first.usage.estimatedCostUsd + second.usage.estimatedCostUsd
    };

    console.log("editor_v0615_summary", JSON.stringify({
      collection: { sourceCount: collection.sourceCount, fetched: collection.fetched, kept: collection.kept, errors: collection.errors },
      submitted: eligible.length,
      returned: cards.length,
      omitted,
      usage: totalUsage,
      calls: [first.usage, second.usage]
    }));

    for (const item of eligible) {
      const card = cards.find(candidate => candidate.articleId === item.candidate.id) ?? null;
      console.log("editor_v0615_card", JSON.stringify({
        articleId: item.candidate.id,
        title: item.candidate.title,
        summary: item.candidate.summary ?? null,
        language: item.candidate.language ?? null,
        sourceName: item.candidate.sourceName,
        sourceUrl: item.candidate.sourceUrl,
        sourceCountry: item.candidate.sourceCountry ?? item.candidate.country ?? null,
        eventCountry: item.candidate.eventCountry ?? null,
        eventLocation: item.candidate.eventLocation ?? null,
        scout: item.scout,
        card
      }));
    }

    return res.status(200).json({
      submitted: eligible.length,
      returned: cards.length,
      omitted,
      usage: totalUsage,
      cards
    });
  } catch (error) {
    console.error("editor_v0615_failed", error);
    return res.status(500).json({
      error: "editor_v0615_failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
