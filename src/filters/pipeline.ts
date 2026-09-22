import type { ArticleCandidate } from "../domain/types.js";
import { hasMinimumContent } from "./index.js";
import { canonicalizeUrl } from "../domain/url.js";

const sensitive = [
  /\b(kill(?:ed|ing|s)?|murder(?:ed|ing|s)?|dead|died|death(?:s)?|fatal(?:ity|ities)?|suicide|rape|abuse|massacre|terror)\b/iu,
  /\b(mort[oaie]|uccis\p{L}*|omicidio|suicidio|stupro|strage|terrorismo)\b/iu,
  /\b(tué\p{L}*|meurtre|mort\p{L}*|décès|suicide|viol|abus|massacre|terrorisme)\b/iu,
  /\b(muert\p{L}*|asesinad\p{L}*|homicidio|suicidio|violación|abuso|masacre|terrorismo)\b/iu,
  /\b(mort\p{L}*|assassinad\p{L}*|homicídio|suicídio|estupro|abuso|massacre|terrorismo)\b/iu,
  /\b(tewas|meninggal|dibunuh|pembunuhan|bunuh diri|pemerkosaan|pelecehan|pembantaian|terorisme)\b/iu,
  /\b(missing child|missing children|kidnap\w*|domestic violence)\b/iu,
  /\b(sequestro di persona|violenza domestica)\b/iu,
  /(?:bambin\p{L}*|sorell\p{L}*).{0,50}scompars\p{L}*|scompars\p{L}*.{0,50}(?:bambin\p{L}*|sorell\p{L}*)/iu,
  /\b(enfant\w* disparu\w*|enlèvement|violence conjugale)\b/iu,
  /\b(niñ\w* desaparecid\w*|secuestro|violencia doméstica)\b/iu,
  /\b(crianç\w* desaparecid\w*|sequestro|violência doméstica)\b/iu,
  /\b(anak\w* hilang|penculikan|kekerasan dalam rumah tangga)\b/iu
];

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
    nearDuplicateSummary: number;
  };
}

export function prefilterDetailed(candidates: ArticleCandidate[]): PrefilterReport {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const acceptedTitles: string[] = [];
  const acceptedSummaries: string[] = [];
  const dropped = {
    insufficient: 0,
    sensitive: 0,
    duplicateUrlOrTitle: 0,
    nearDuplicateTitle: 0,
    nearDuplicateSummary: 0
  };
  const accepted: ArticleCandidate[] = [];

  for (const candidate of candidates) {
    if (!hasMinimumContent(candidate)) { dropped.insufficient++; continue; }
    const material = `${candidate.title} ${candidate.summary ?? ""}`;
    if (sensitive.some(rule => rule.test(material))) { dropped.sensitive++; continue; }

    const url = canonicalizeUrl(candidate.sourceUrl);
    const title = titleKey(candidate.title);
    if (seenUrls.has(url) || seenTitles.has(title)) { dropped.duplicateUrlOrTitle++; continue; }

    // Cross-publisher syndication often changes only a few words. This cheap pass
    // avoids paying Scout twice for substantially the same headline.
    if (acceptedTitles.some(previous => titleSimilarity(previous, candidate.title) >= 0.82)) {
      dropped.nearDuplicateTitle++;
      continue;
    }

    const summary = candidate.summary?.trim();
    if (
      summary
      && summary.length >= 120
      && acceptedSummaries.some(previous => titleSimilarity(previous, summary) >= 0.90)
    ) {
      dropped.nearDuplicateSummary++;
      continue;
    }

    seenUrls.add(url);
    seenTitles.add(title);
    acceptedTitles.push(candidate.title);
    if (summary && summary.length >= 120) acceptedSummaries.push(summary);
    accepted.push(candidate);
  }

  return { candidates: accepted, dropped };
}

export function prefilter(candidates: ArticleCandidate[]): ArticleCandidate[] {
  return prefilterDetailed(candidates).candidates;
}
