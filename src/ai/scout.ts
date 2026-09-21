import OpenAI from "openai";
import type { ArticleCandidate, ScoutResult } from "../domain/types.js";

export interface Scout {
  classify(candidates: ArticleCandidate[]): Promise<ScoutResult[]>;
}

const instructions = `
You are Luna Scout, the first editorial classifier for WTF Engine.

Goal: identify real-world stories worth turning into a light, surprising and shareable game.
Primary question: would a person plausibly enjoy discovering, playing or sharing this story?

Do not equate unusual with good. Weird but boring can be REJECT.
Use only facts in the supplied candidate material. Never invent supporting facts.
Evidence status:
- SUPPORTED: supplied material gives enough support to classify the story.
- UNCERTAIN: potentially good but evidence/context is insufficient.
- UNSUPPORTED: core claim is not supported by supplied material.

Decision:
- KEEP: strong playable candidate.
- MAYBE: potentially useful but needs evidence/editorial judgment.
- REJECT: insufficiently playable, suitable or reliable.

Modes are independent:
- WTF: completed real event suitable for a surprising quiz/bet.
- PREDICT: future event with an objective verifiable resolution.
- STORY: event worth following through updates/checkpoints.

Reject or strongly penalize entertainment that depends on death, serious injury,
disaster, abuse or other tragedy.

All score fields are integers from 0 to 100.
Sensitivity: 0 means harmless/light; 100 means highly sensitive.
Keep reasons short and editorially useful.
`.trim();

const scoreSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    funny: { type: "integer", minimum: 0, maximum: 100 },
    wtf: { type: "integer", minimum: 0, maximum: 100 },
    shareability: { type: "integer", minimum: 0, maximum: 100 },
    internationalAccessibility: { type: "integer", minimum: 0, maximum: 100 },
    verifiability: { type: "integer", minimum: 0, maximum: 100 },
    sensitivity: { type: "integer", minimum: 0, maximum: 100 }
  },
  required: ["funny", "wtf", "shareability", "internationalAccessibility", "verifiability", "sensitivity"]
} as const;

const resultSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          articleId: { type: "string" },
          decision: { type: "string", enum: ["KEEP", "MAYBE", "REJECT"] },
          modes: {
            type: "array",
            items: { type: "string", enum: ["WTF", "PREDICT", "STORY"] }
          },
          scores: scoreSchema,
          reason: { type: "string" },
          evidenceStatus: { type: "string", enum: ["SUPPORTED", "UNCERTAIN", "UNSUPPORTED"] }
        },
        required: ["articleId", "decision", "modes", "scores", "reason", "evidenceStatus"]
      }
    }
  },
  required: ["results"]
} as const;

function compactCandidate(candidate: ArticleCandidate) {
  return {
    id: candidate.id,
    sourceName: candidate.sourceName,
    sourceUrl: candidate.sourceUrl,
    title: candidate.title,
    summary: candidate.summary ?? null,
    publishedAt: candidate.publishedAt ?? null,
    language: candidate.language ?? null,
    country: candidate.country ?? null
  };
}

export class OpenAIScout implements Scout {
  private readonly client: OpenAI;

  constructor(apiKey = process.env.OPENAI_API_KEY) {
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
    this.client = new OpenAI({ apiKey });
  }

  async classify(candidates: ArticleCandidate[]): Promise<ScoutResult[]> {
    if (candidates.length === 0) return [];

    const response = await this.client.responses.create({
      model: process.env.OPENAI_SCOUT_MODEL ?? "gpt-5.6-luna",
      instructions,
      input: JSON.stringify(candidates.map(compactCandidate)),
      text: {
        format: {
          type: "json_schema",
          name: "wtf_scout_batch",
          strict: true,
          schema: resultSchema
        }
      }
    });

    const parsed = JSON.parse(response.output_text) as { results: ScoutResult[] };
    return parsed.results;
  }
}
