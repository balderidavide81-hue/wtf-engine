import type { GameCardDraft } from "../ai/editor.js";
import type { ArticleCandidate, ScoutResult } from "../domain/types.js";
import type { AiUsageDiagnostics } from "../ai/scout.js";

export type EditionStatus = "draft" | "reviewed" | "published";
export type CardLifecycleStatus = "draft" | "reviewed" | "published" | "open" | "resolved" | "void" | "rejected";

export interface PersistedPipelineRun {
  collection: unknown;
  candidates: ArticleCandidate[];
  scoutResults: ScoutResult[];
  cards: GameCardDraft[];
  ai: {
    scout: AiUsageDiagnostics;
    editor: AiUsageDiagnostics;
    totalEstimatedCostUsd: number;
  };
}

export interface DailyEditionRecord {
  id: string;
  editionDate: string;
  status: EditionStatus;
  cardIds: string[];
}

export interface EditorialCardRecord {
  id: string;
  articleId: string;
  mode: "WTF" | "PREDICT" | "STORY";
  hook: string;
  question: string;
  options: string[];
  correctOptionIndex: number | null;
  reveal: string;
  resolutionRule: string | null;
  lifecycleStatus: CardLifecycleStatus;
  sourceName: string;
  sourceUrl: string;
  title: string;
}

export interface EditorialEditionRecord extends DailyEditionRecord {
  cards: EditorialCardRecord[];
}

export interface PublicGameCardRecord {
  id: string;
  mode: "WTF" | "PREDICT" | "STORY";
  hook: string;
  question: string;
  options: string[];
  reveal: string | null;
  sourceName: string;
  sourceUrl: string;
}

export interface PublicEditionRecord {
  editionDate: string;
  cards: PublicGameCardRecord[];
}

export interface PredictionResolutionInput {
  outcomeOptionIndex: number;
  evidenceUrl: string;
  evidenceNote: string;
}

export interface PredictionVoidInput {
  reason: string;
  evidenceUrl?: string;
}
