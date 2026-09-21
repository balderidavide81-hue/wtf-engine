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
