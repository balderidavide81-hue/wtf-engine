import type { VercelRequest, VercelResponse } from "@vercel/node";
import { EDITOR_PROMPT_VERSION, OpenAIEditor } from "../src/ai/editor.js";
import { NeonContentStore } from "../src/store/neon-content-store.js";
import { editorV0617ProbeItems } from "../src/probes/editor-v0617-fixture.js";

const PROBE_NONCE = "v0617-editor-regen-3d6a8f2c91b4";

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

  const batch = Number(req.query.batch);
  if (batch !== 1 && batch !== 2) return res.status(400).json({ error: "batch_must_be_1_or_2" });

  const start = batch === 1 ? 0 : 8;
  const items = editorV0617ProbeItems.slice(start, start + 8);
  if (items.length !== 8) {
    return res.status(500).json({ error: "fixture_batch_size_invalid", batch, count: items.length });
  }

  const leaseKey = `probe:v0617:editor-regeneration:${batch}:2026-09-22`;
  const store = new NeonContentStore();
  const owner = await store.tryAcquireGenerationLease(leaseKey, 3600);
  if (!owner) return res.status(409).json({ error: "probe_batch_already_consumed", batch });

  try {
    console.log("editor_v0617_start", JSON.stringify({
      batch,
      promptVersion: EDITOR_PROMPT_VERSION,
      articleIds: items.map(item => item.candidate.id)
    }));

    const edited = await new OpenAIEditor().draft(items, 8);

    console.log("editor_v0617_summary", JSON.stringify({
      batch,
      promptVersion: EDITOR_PROMPT_VERSION,
      submitted: items.length,
      returned: edited.cards.length,
      usage: edited.usage
    }));

    for (const item of items) {
      const card = edited.cards.find(card => card.articleId === item.candidate.id) ?? null;
      console.log("editor_v0617_card", JSON.stringify({
        batch,
        promptVersion: EDITOR_PROMPT_VERSION,
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
      batch,
      promptVersion: EDITOR_PROMPT_VERSION,
      submitted: items.length,
      returned: edited.cards.length,
      usage: edited.usage,
      cards: edited.cards
    });
  } catch (error) {
    console.error("editor_v0617_failed", JSON.stringify({
      batch,
      promptVersion: EDITOR_PROMPT_VERSION,
      message: error instanceof Error ? error.message : String(error)
    }));
    return res.status(500).json({
      error: "editor_v0617_failed",
      batch,
      promptVersion: EDITOR_PROMPT_VERSION,
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
