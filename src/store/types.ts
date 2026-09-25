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

export interface ContentGateMetricsRecord {
  editionDate: string;
  editionStatus: EditionStatus;
  telemetryComplete: boolean;
  totalCards: number;
  keptCards: number;
  rejectedCards: number;
  decidedCards: number;
  editedCards: number;
  editedKeptCards: number;
  cleanKeptCards: number;
  editActions: number;
  reviewActions: number;
  rejectActions: number;
  generationRunCount: number;
  estimatedGenerationCostUsd: number;
  firstEditorialEventAt: string | null;
  lastEditorialEventAt: string | null;
  lifecycle: Record<CardLifecycleStatus, number>;
  modes: Record<"WTF" | "PREDICT" | "STORY", number>;
  interactions: Record<InteractionType, number>;
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
  editionDate: string;
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


export type GameplayTelemetryEventType =
  | "session_started"
  | "card_viewed"
  | "predict_selected"
  | "session_completed";

export type GameplayExposure = "fresh" | "repeat" | "unknown";

export interface GameplayTelemetryEventInput {
  sessionId: string;
  eventType: GameplayTelemetryEventType;
  cardId?: string;
  position?: number;
  selectedOptionIndex?: number;
  totalCards?: number;
  score?: number;
  answered?: number;
  predictions?: number;
  editionDate?: string;
  exposure?: GameplayExposure;
}

export interface GameplayAnswerTelemetryInput {
  sessionId: string;
  position?: number;
}

export interface GameplayMetricsRecord {
  since: string;
  sessionsStarted: number;
  sessionsCompleted: number;
  completionRate: number | null;
  cardsViewed: number;
  uniqueCardsViewed: number;
  answers: number;
  correctAnswers: number;
  answerAccuracy: number | null;
  predictSelections: number;
  freshSessionsStarted: number;
  repeatSessionsStarted: number;
  unknownExposureSessionsStarted: number;
  freshAnswers: number;
  freshCorrectAnswers: number;
  freshAnswerAccuracy: number | null;
  averageCardsViewedPerStartedSession: number | null;
  cards: Array<{
    cardId: string;
    hook: string;
    mode: "WTF" | "PREDICT" | "STORY";
    interactionType: InteractionType;
    views: number;
    answers: number;
    correctAnswers: number;
    answerAccuracy: number | null;
    predictSelections: number;
    freshAnswers: number;
    freshCorrectAnswers: number;
    freshAnswerAccuracy: number | null;
  }>;
  recentSessions: Array<{
    sessionKey: string;
    startedAt: string | null;
    completedAt: string | null;
    cardsViewed: number;
    answers: number;
    correctAnswers: number;
    predictions: number;
    maxPosition: number | null;
    exposure: GameplayExposure;
    editionDate: string | null;
  }>;
}
