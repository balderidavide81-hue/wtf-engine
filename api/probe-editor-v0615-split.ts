import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OpenAIEditor } from "../src/ai/editor.js";
import { NeonContentStore } from "../src/store/neon-content-store.js";
import { editorProbeItems } from "../src/probes/editor-v0615-fixture.js";

const PROBE_NONCE = "v0615-editor-split-4b8f3c2e91d7";

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
  if (batch !== 1 && batch !== 2 && batch !== 3) {
    return res.status(400).json({ error: "batch_must_be_1_2_or_3" });
  }

  // batch=3 is a one-shot retry of the second half after the cardinality fix.
  const start = batch === 1 ? 0 : 8;
  const items = editorProbeItems.slice(start, start + 8);
  if (items.length !== 8) return res.status(500).json({ error: "fixture_batch_size_invalid", batch, count: items.length });

  const leaseKey = `probe:v0615:editor-split:${batch}:2026-09-22`;
  const store = new NeonContentStore();
  const owner = await store.tryAcquireGenerationLease(leaseKey, 3600);
  if (!owner) return res.status(409).json({ error: "probe_batch_already_consumed", batch });

  try {
    console.log("editor_v0615_split_start", JSON.stringify({
      batch,
      articleIds: items.map(item => item.candidate.id)
    }));

    const edited = await new OpenAIEditor().draft(items, 8);
    const returnedIds = new Set(edited.cards.map(card => card.articleId));
    const omitted = items
      .map(item => item.candidate.id)
      .filter(id => !returnedIds.has(id));

    console.log("editor_v0615_split_summary", JSON.stringify({
      batch,
      submitted: items.length,
      returned: edited.cards.length,
      omitted,
      usage: edited.usage
    }));

    for (const item of items) {
      const card = edited.cards.find(candidate => candidate.articleId === item.candidate.id) ?? null;
      console.log("editor_v0615_split_card", JSON.stringify({
        batch,
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
      submitted: items.length,
      returned: edited.cards.length,
      omitted,
      usage: edited.usage,
      cards: edited.cards
    });
  } catch (error) {
    console.error("editor_v0615_split_failed", JSON.stringify({
      batch,
      message: error instanceof Error ? error.message : String(error)
    }));
    return res.status(500).json({
      error: "editor_v0615_split_failed",
      batch,
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
