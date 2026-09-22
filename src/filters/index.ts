import type { ArticleCandidate } from "../domain/types.js";
import { isHttpUrl } from "../domain/url.js";

export function hasMinimumContent(candidate: ArticleCandidate): boolean {
  return candidate.title.trim().length >= 12 && isHttpUrl(candidate.sourceUrl);
}
