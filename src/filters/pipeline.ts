import type { ArticleCandidate } from "../domain/types.js";
import { hasMinimumContent } from "./index.js";

const sensitive = [
  /\b(killed|murder|dead|death|fatal|suicide|rape|abuse|massacre|terror)\b/i,
  /\b(morto|morta|uccis[oa]|omicidio|suicidio|stupro|strage|terrorismo)\b/i
];

function canonicalUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith("utm_") || ["fbclid", "gclid"].includes(key)) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function titleKey(title: string): string {
  return title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function prefilter(candidates: ArticleCandidate[]): ArticleCandidate[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  return candidates.filter(candidate => {
    if (!hasMinimumContent(candidate)) return false;
    const material = `${candidate.title} ${candidate.summary ?? ""}`;
    if (sensitive.some(rule => rule.test(material))) return false;

    const url = canonicalUrl(candidate.sourceUrl);
    const title = titleKey(candidate.title);
    if (seenUrls.has(url) || seenTitles.has(title)) return false;

    seenUrls.add(url);
    seenTitles.add(title);
    return true;
  });
}
