import type { GameCardDraft } from "../ai/editor.js";
import type { ArticleCandidate, GameCategory, InteractionType, MediaUsageStatus, ScoutResult } from "../domain/types.js";
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
  interactionType: InteractionType;
  category: GameCategory;
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
  imageUrlOriginal: string | null;
  imageUrlCached: string | null;
  imageAltText: string | null;
  imageUsageStatus: MediaUsageStatus;
}

export interface EditorialEditionRecord extends DailyEditionRecord {
  cards: EditorialCardRecord[];
}

export interface DraftCardEditInput {
  hook: string;
  question: string;
  options: string[];
  correctOptionIndex: number | null;
  reveal: string;
  resolutionRule: string | null;
}

export interface PublicGameCardRecord {
  id: string;
  mode: "WTF" | "PREDICT" | "STORY";
  interactionType: InteractionType;
  category: GameCategory;
  status: Extract<CardLifecycleStatus, "published" | "open" | "resolved" | "void">;
  hook: string;
  question: string;
  options: string[];
  resolutionRule: string | null;
  resolvedOptionIndex: number | null;
  reveal: string | null;
  voidReason: string | null;
  resolutionEvidenceUrl: string | null;
  sourceName: string;
  sourceUrl: string;
  imageUrl: string | null;
  imageAltText: string | null;
  publishedAt: string;
}

export interface PublicEditionRecord {
  editionDate: string;
  cards: PublicGameCardRecord[];
}

export interface PublicFeedRecord {
  cards: PublicGameCardRecord[];
}

export interface GameplayAnswerRecord {
  cardId: string;
  selectedOptionIndex: number;
  correct: boolean;
  correctOptionIndex: number;
  reveal: string;
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
