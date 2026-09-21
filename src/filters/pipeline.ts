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

function titleWords(title: string): Set<string> {
  return new Set(
    title.toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .split(/\s+/)
      .filter(word => word.length >= 3)
  );
}

function titleKey(title: string): string {
  return [...titleWords(title)].join(" ");
}

function titleSimilarity(a: string, b: string): number {
  const left = titleWords(a);
  const right = titleWords(b);
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const word of left) if (right.has(word)) intersection++;
  return intersection / Math.min(left.size, right.size);
}

export interface PrefilterReport {
  candidates: ArticleCandidate[];
  dropped: {
    insufficient: number;
    sensitive: number;
    duplicateUrlOrTitle: number;
    nearDuplicateTitle: number;
  };
}

export function prefilterDetailed(candidates: ArticleCandidate[]): PrefilterReport {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const acceptedTitles: string[] = [];
  const dropped = { insufficient: 0, sensitive: 0, duplicateUrlOrTitle: 0, nearDuplicateTitle: 0 };
  const accepted: ArticleCandidate[] = [];

  for (const candidate of candidates) {
    if (!hasMinimumContent(candidate)) { dropped.insufficient++; continue; }
    const material = `${candidate.title} ${candidate.summary ?? ""}`;
    if (sensitive.some(rule => rule.test(material))) { dropped.sensitive++; continue; }

    const url = canonicalUrl(candidate.sourceUrl);
    const title = titleKey(candidate.title);
    if (seenUrls.has(url) || seenTitles.has(title)) { dropped.duplicateUrlOrTitle++; continue; }

    // Cross-publisher syndication often changes only a few words. This cheap pass
    // avoids paying Scout twice for substantially the same headline.
    if (acceptedTitles.some(previous => titleSimilarity(previous, candidate.title) >= 0.82)) {
      dropped.nearDuplicateTitle++;
      continue;
    }

    seenUrls.add(url);
    seenTitles.add(title);
    acceptedTitles.push(candidate.title);
    accepted.push(candidate);
  }

  return { candidates: accepted, dropped };
}

export function prefilter(candidates: ArticleCandidate[]): ArticleCandidate[] {
  return prefilterDetailed(candidates).candidates;
}
