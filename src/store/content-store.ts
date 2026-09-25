import type { ArticleCandidate, MediaUsageStatus } from "../domain/types.js";
import type {
  PersistedPipelineRun,
  DailyEditionRecord,
  EditorialEditionRecord,
  CardLifecycleStatus,
  EditionStatus,
  PublicEditionRecord,
  PublicFeedRecord,
  PredictionResolutionInput,
  PredictionVoidInput,
  DraftCardEditInput,
  GameplayAnswerRecord,
  ContentGateMetricsRecord
} from "./types.js";

export interface ContentStore {
  /** Prompt-version-aware model processing dedupe. */
  findProcessedCandidateIds(candidates: ArticleCandidate[]): Promise<Set<string>>;

  /** Player-facing anti-repeat, independent of prompt version. */
  findKnownStoryCandidateIds(candidates: ArticleCandidate[]): Promise<Set<string>>;

  tryAcquireGenerationLease(leaseKey: string, ttlSeconds: number): Promise<string | null>;
  releaseGenerationLease(leaseKey: string, ownerToken: string): Promise<void>;

  saveCompletedRun(run: PersistedPipelineRun): Promise<{ runId: string; cardIds: string[] }>;
  appendDraftEdition(editionDate: string, cardIds: string[]): Promise<DailyEditionRecord>;

  getEdition(editionDate: string): Promise<DailyEditionRecord | null>;
  getEditorialEdition(editionDate: string): Promise<EditorialEditionRecord | null>;
  getContentGateMetrics(editionDate: string): Promise<ContentGateMetricsRecord | null>;
  getPublishedEdition(editionDate: string): Promise<PublicEditionRecord | null>;
  getPublishedFeed(limit: number, before?: string): Promise<PublicFeedRecord>;
  answerPublishedCard(cardId: string, selectedOptionIndex: number): Promise<GameplayAnswerRecord | null>;

  updateDraftCard(
    editionDate: string,
    cardId: string,
    input: DraftCardEditInput
  ): Promise<void>;

  setCardLifecycle(
    editionDate: string,
    cardId: string,
    status: Extract<CardLifecycleStatus, "reviewed" | "rejected">
  ): Promise<void>;

  setEditionStatus(
    editionDate: string,
    status: Extract<EditionStatus, "reviewed" | "published">
  ): Promise<DailyEditionRecord>;

  setArticleMediaUsage(
    articleId: string,
    status: MediaUsageStatus,
    cachedUrl?: string
  ): Promise<void>;

  resolvePrediction(cardId: string, input: PredictionResolutionInput): Promise<void>;
  voidPrediction(cardId: string, input: PredictionVoidInput): Promise<void>;
}
