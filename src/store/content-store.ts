import type { PersistedPipelineRun, DailyEditionRecord } from "./types.js";

export interface ContentStore {
  /** Returns stable article IDs already processed by Scout, allowing AI spend to be skipped. */
  findProcessedExternalIds(externalIds: string[]): Promise<Set<string>>;

  /**
   * Persists one completed generation. Implementations must upsert articles by
   * stable external/canonical identity so reruns do not duplicate source material.
   */
  saveCompletedRun(run: PersistedPipelineRun): Promise<{ runId: string; cardIds: string[] }>;

  /** Creates or replaces the draft ordering for a calendar day. */
  saveDraftEdition(editionDate: string, cardIds: string[]): Promise<DailyEditionRecord>;

  getEdition(editionDate: string): Promise<DailyEditionRecord | null>;
}
