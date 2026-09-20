import type { ArticleCandidate } from "../domain/types.js";

export function hasMinimumContent(candidate: ArticleCandidate): boolean {
  return candidate.title.trim().length >= 12 && candidate.sourceUrl.startsWith("http");
}
