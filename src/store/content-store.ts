import type { PersistedPipelineRun, DailyEditionRecord } from "./types.js";

export interface ContentStore {
  /**
   * Persists one completed generation atomically.
   * Implementations must upsert articles by stable external/canonical identity so
   * reruns do not create duplicate source material.
   */
  saveCompletedRun(run: PersistedPipelineRun): Promise<{ runId: string; cardIds: string[] }>;

  /**
   * Creates or replaces the draft ordering for a calendar day.
   * Publishing remains a separate explicit action.
   */
  saveDraftEdition(editionDate: string, cardIds: string[]): Promise<DailyEditionRecord>;

  getEdition(editionDate: string): Promise<DailyEditionRecord | null>;
}
