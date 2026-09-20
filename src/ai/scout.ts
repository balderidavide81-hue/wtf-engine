import type { ArticleCandidate, ScoutResult } from "../domain/types.js";

/**
 * Luna Scout boundary.
 *
 * The OpenAI transport is intentionally not wired in Block 1. Keeping the
 * contract separate lets ingestion, evaluation and model versions evolve
 * independently.
 */
export interface Scout {
  classify(candidates: ArticleCandidate[]): Promise<ScoutResult[]>;
}
