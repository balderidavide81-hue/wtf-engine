import type { PersistedPipelineRun, DailyEditionRecord, EditorialEditionRecord, CardLifecycleStatus, EditionStatus, PublicEditionRecord, PredictionResolutionInput, PredictionVoidInput } from "./types.js";

export interface ContentStore {
  /** Returns stable article IDs already processed by Scout, allowing AI spend to be skipped. */
  findProcessedExternalIds(externalIds: string[]): Promise<Set<string>>;

  /**
   * Persists one completed generation. Implementations must upsert articles by
   * stable external/canonical identity so reruns do not duplicate source material.
   */
  saveCompletedRun(run: PersistedPipelineRun): Promise<{ runId: string; cardIds: string[] }>;

  /**
   * Appends newly generated cards to a draft edition without deleting existing
   * cards. Must be idempotent for repeated card IDs and must refuse to mutate a
   * reviewed/published edition.
   */
  appendDraftEdition(editionDate: string, cardIds: string[]): Promise<DailyEditionRecord>;

  getEdition(editionDate: string): Promise<DailyEditionRecord | null>;
  getEditorialEdition(editionDate: string): Promise<EditorialEditionRecord | null>;
  getPublishedEdition(editionDate: string): Promise<PublicEditionRecord | null>;
  setCardLifecycle(cardId: string, status: Extract<CardLifecycleStatus, "reviewed" | "rejected">): Promise<void>;
  setEditionStatus(editionDate: string, status: Extract<EditionStatus, "reviewed" | "published">): Promise<DailyEditionRecord>;
  resolvePrediction(cardId: string, input: PredictionResolutionInput): Promise<void>;
  voidPrediction(cardId: string, input: PredictionVoidInput): Promise<void>;
}
