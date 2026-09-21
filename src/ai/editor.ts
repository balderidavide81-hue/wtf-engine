import OpenAI from "openai";
import type { ArticleCandidate, ScoutResult } from "../domain/types.js";
import type { AiUsageDiagnostics } from "./scout.js";

export interface GameCardDraft {
  articleId: string;
  mode: "WTF" | "PREDICT" | "STORY";
  hook: string;
  question: string;
  options: string[];
  correctOptionIndex: number | null;
  reveal: string;
  resolutionRule: string | null;
}

export interface EditorBatch {
  cards: GameCardDraft[];
  usage: AiUsageDiagnostics;
}

export const EDITOR_PROMPT_VERSION = "editor/inline-v0.1";

const instructions = `
You are Luna Editor for WTF Engine.
Turn only strong, supported Scout KEEP candidates into concise game-card drafts.
Use only supplied facts. Never invent names, numbers, dates, outcomes or evidence.
WTF cards are completed events and need a resolvable multiple-choice reveal.
PREDICT cards must describe a genuinely future, objectively verifiable outcome and a precise resolution rule.
STORY cards must have a concrete reason to follow the event.
Prefer curiosity and surprise over clickbait. Avoid making tragedy, danger or suffering entertaining.
`.trim();

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    cards: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          articleId: { type: "string" },
          mode: { type: "string", enum: ["WTF", "PREDICT", "STORY"] },
          hook: { type: "string" },
          question: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correctOptionIndex: { type: ["integer", "null"], minimum: 0 },
          reveal: { type: "string" },
          resolutionRule: { type: ["string", "null"] }
        },
        required: ["articleId", "mode", "hook", "question", "options", "correctOptionIndex", "reveal", "resolutionRule"]
      }
    }
  },
  required: ["cards"]
} as const;

const DEFAULT_EDITOR_LIMIT = 12;

function validateCardDraft(card: GameCardDraft): void {
  if (card.options.length < 2) throw new Error(`Editor card ${card.articleId} must have at least two options`);
  if (card.correctOptionIndex !== null &&
      (!Number.isInteger(card.correctOptionIndex) || card.correctOptionIndex < 0 || card.correctOptionIndex >= card.options.length)) {
    throw new Error(`Editor card ${card.articleId} has an invalid correctOptionIndex`);
  }
  if (card.mode === "WTF" && card.correctOptionIndex === null) {
    throw new Error(`WTF card ${card.articleId} requires a correctOptionIndex`);
  }
  if (card.mode === "PREDICT") {
    if (card.correctOptionIndex !== null) throw new Error(`PREDICT card ${card.articleId} must not have a resolved answer`);
    if (!card.resolutionRule?.trim()) throw new Error(`PREDICT card ${card.articleId} requires a resolutionRule`);
  }
}


function compactEditorItem(item: { candidate: ArticleCandidate; scout: ScoutResult }) {
  return {
    candidate: {
      id: item.candidate.id,
      sourceName: item.candidate.sourceName,
      sourceUrl: item.candidate.sourceUrl,
      title: item.candidate.title,
      summary: item.candidate.summary ?? null,
      publishedAt: item.candidate.publishedAt ?? null,
      language: item.candidate.language ?? null,
      country: item.candidate.country ?? null
    },
    scout: item.scout
  };
}

export class OpenAIEditor {
  private readonly client: OpenAI;
  constructor(apiKey = process.env.OPENAI_API_KEY) {
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
    this.client = new OpenAI({ apiKey });
  }

  async draft(items: Array<{ candidate: ArticleCandidate; scout: ScoutResult }>, limit = DEFAULT_EDITOR_LIMIT): Promise<EditorBatch> {
    const eligible = items
      .filter(item => item.scout.decision === "KEEP" && item.scout.evidenceStatus === "SUPPORTED")
      .slice(0, Math.max(1, Math.min(limit, DEFAULT_EDITOR_LIMIT)));
    if (eligible.length === 0) {
      return { cards: [], usage: emptyUsage(process.env.OPENAI_EDITOR_MODEL ?? "gpt-5.6-luna") };
    }

    const model = process.env.OPENAI_EDITOR_MODEL ?? "gpt-5.6-luna";
    const response = await this.client.responses.create({
      model,
      instructions,
      input: JSON.stringify(eligible.map(compactEditorItem)),
      text: { format: { type: "json_schema", name: "wtf_editor_batch", strict: true, schema } }
    });
    const parsed = JSON.parse(response.output_text) as { cards: GameCardDraft[] };
    const seenArticleIds = new Set<string>();
    for (const card of parsed.cards) {
      validateCardDraft(card);
      if (seenArticleIds.has(card.articleId)) {
        throw new Error(`Editor returned duplicate card for article ${card.articleId}`);
      }
      seenArticleIds.add(card.articleId);
    }
    return { cards: parsed.cards, usage: makeUsage(response, model) };
  }
}

const pricing = {
  inputPerMillionUsd: 0.20, cachedInputPerMillionUsd: 0.02, outputPerMillionUsd: 1.20,
  source: "OpenAI GPT-5.6 Luna standard pricing, 2026-09-21"
};

function emptyUsage(model: string): AiUsageDiagnostics {
  return { model, inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0, pricing };
}

function makeUsage(response: OpenAI.Responses.Response, model: string): AiUsageDiagnostics {
  const inputTokens = response.usage?.input_tokens ?? 0;
  const cachedInputTokens = response.usage?.input_tokens_details?.cached_tokens ?? 0;
  const outputTokens = response.usage?.output_tokens ?? 0;
  const totalTokens = response.usage?.total_tokens ?? inputTokens + outputTokens;
  const estimatedCostUsd =
    ((inputTokens - cachedInputTokens) * pricing.inputPerMillionUsd +
      cachedInputTokens * pricing.cachedInputPerMillionUsd +
      outputTokens * pricing.outputPerMillionUsd) / 1_000_000;
  return { model, inputTokens, cachedInputTokens, outputTokens, totalTokens, estimatedCostUsd, pricing };
}
