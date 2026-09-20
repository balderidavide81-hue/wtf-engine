import type { ArticleCandidate } from "../domain/types.js";

export interface NewsSource {
  readonly name: string;
  fetchCandidates(): Promise<ArticleCandidate[]>;
}
