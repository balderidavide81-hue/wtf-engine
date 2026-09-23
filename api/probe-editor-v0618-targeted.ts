import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { ArticleCandidate, ScoutResult } from "../src/domain/types.js";
import { EDITOR_PROMPT_VERSION, OpenAIEditor } from "../src/ai/editor.js";
import { NeonContentStore } from "../src/store/neon-content-store.js";

const PROBE_NONCE = "v0618-targeted-editor-7a4e2c91d6b3";
const PROBE_LEASE = "probe:v0618:targeted-editor:2026-09-22";

const items: Array<{ candidate: ArticleCandidate; scout: ScoutResult }> = [
  {
    candidate: {
      id: "upi-odd-news:https://www.upi.com/Odd_News/2026/09/17/guinness-world-records-slim-jim/1191789667547/",
      sourceName: "UPI Odd News",
      sourceUrl: "https://www.upi.com/Odd_News/2026/09/17/guinness-world-records-slim-jim/1191789667547/",
      title: "Watch: Nearly 430-foot Slim Jim breaks world record in Omaha",
      summary: "Conagra Brands unspooled a Slim Jim measuring 429 feet and 5.4 inches long in Nebraska to break the Guinness World Record for the longest meat snack.",
      publishedAt: "Thu, 17 Sep 2026 13:55:33 -0400",
      language: "en",
      sourceLanguage: "en",
      country: "US",
      sourceCountry: "US",
      eventCountry: "US",
      eventLocation: "Nebraska",
      discoverySource: "UPI Odd News"
    },
    scout: {
      articleId: "upi-odd-news:https://www.upi.com/Odd_News/2026/09/17/guinness-world-records-slim-jim/1191789667547/",
      decision: "KEEP",
      modes: ["WTF"],
      scores: { funny: 84, wtf: 86, shareability: 87, internationalAccessibility: 78, verifiability: 94, sensitivity: 3 },
      reason: "A 429-foot meat snack is absurdly tangible and offers a strong visual record challenge.",
      evidenceStatus: "SUPPORTED"
    }
  },
  {
    candidate: {
      id: "phys-org-plants-animals:https://phys.org/news/2026-09-bolivia-tilcayo-tiger-cat-wildcat.html",
      sourceName: "Phys.org Plants & Animals",
      sourceUrl: "https://phys.org/news/2026-09-bolivia-tilcayo-tiger-cat-wildcat.html",
      title: "Bolivia's tilcayo tiger cat becomes first new wildcat species in 100 years",
      summary: "Scientists have discovered a new species of wild cat for the first time in more than a century, a Bolivian researcher told AFP on Thursday.",
      publishedAt: "Fri, 18 Sep 2026 02:49:43 EDT",
      language: "en",
      sourceLanguage: "en",
      country: "GLOBAL",
      sourceCountry: "GLOBAL",
      eventCountry: "BO",
      eventLocation: "Bolivia",
      discoverySource: "Phys.org Plants & Animals",
      categoryHint: "animals"
    },
    scout: {
      articleId: "phys-org-plants-animals:https://phys.org/news/2026-09-bolivia-tilcayo-tiger-cat-wildcat.html",
      decision: "KEEP",
      modes: ["WTF", "STORY"],
      scores: { funny: 38, wtf: 78, shareability: 72, internationalAccessibility: 73, verifiability: 78, sensitivity: 6 },
      reason: "The first newly recognized wildcat species in a century is a strong rarity hook with follow-up potential.",
      evidenceStatus: "SUPPORTED"
    }
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
    console.log("editor_v0618_targeted_start", JSON.stringify({
      promptVersion: EDITOR_PROMPT_VERSION,
      articleIds: items.map(item => item.candidate.id)
    }));

    const edited = await new OpenAIEditor().draft(items, 2);

    console.log("editor_v0618_targeted_summary", JSON.stringify({
      promptVersion: EDITOR_PROMPT_VERSION,
      submitted: items.length,
      returned: edited.cards.length,
      usage: edited.usage
    }));

    for (const item of items) {
      const card = edited.cards.find(card => card.articleId === item.candidate.id) ?? null;
      console.log("editor_v0618_targeted_card", JSON.stringify({
        promptVersion: EDITOR_PROMPT_VERSION,
        articleId: item.candidate.id,
        title: item.candidate.title,
        summary: item.candidate.summary ?? null,
        scout: item.scout,
        card
      }));
    }

    return res.status(200).json({
      promptVersion: EDITOR_PROMPT_VERSION,
      submitted: items.length,
      returned: edited.cards.length,
      usage: edited.usage,
      cards: edited.cards
    });
  } catch (error) {
    console.error("editor_v0618_targeted_failed", JSON.stringify({
      promptVersion: EDITOR_PROMPT_VERSION,
      message: error instanceof Error ? error.message : String(error)
    }));
    return res.status(500).json({
      error: "editor_v0618_targeted_failed",
      promptVersion: EDITOR_PROMPT_VERSION,
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
