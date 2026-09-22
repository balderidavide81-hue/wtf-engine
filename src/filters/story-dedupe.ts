import type { ArticleCandidate } from "../domain/types.js";

const STOPWORDS = new Set([
  // English
  "about","after","again","against","also","among","and","are","because","been","before","being","between","but","can","could","does","for","from","had","has","have","into","its","more","most","new","not","over","said","than","that","the","their","them","then","there","these","they","this","through","under","was","were","what","when","where","which","while","who","will","with","would",
  // Italian
  "anche","che","con","dalla","dalle","della","delle","degli","dei","del","dopo","gli","nel","nella","nelle","non","per","piu","sono","tra","una","uno",
  // French
  "avec","dans","des","depuis","du","elle","elles","entre","est","les","leur","leurs","mais","pas","plus","pour","que","qui","sans","sur","une",
  // Spanish
  "como","con","del","desde","entre","esta","este","las","los","mas","para","pero","por","que","sin","sobre","una","uno",
  // Portuguese
  "como","com","das","dos","em","mais","nao","para","por","que","uma","um",
  // Bahasa Indonesia
  "adalah","akan","atau","dalam","dan","dari","dengan","ini","itu","juga","karena","oleh","pada","sebagai","tidak","untuk","yang"
]);

const SYNONYMS = new Map<string, string>([
  ["canine", "dog"], ["canines", "dog"], ["dogs", "dog"],
  ["journey", "travel"], ["journeys", "travel"], ["trek", "travel"], ["treks", "travel"],
  ["traveling", "travel"], ["travelling", "travel"], ["traveled", "travel"], ["travelled", "travel"],
  ["movement", "travel"], ["movements", "travel"],
  ["recorded", "record"], ["records", "record"], ["recordbreaking", "record"],
  ["longest", "record"], ["largest", "record"], ["smallest", "record"], ["fastest", "record"],
  ["mates", "mate"], ["mating", "mate"],
  ["african", "africa"],
  ["animals", "animal"], ["species", "species"]
]);

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase();
}

function tokenRoot(token: string): string {
  const direct = SYNONYMS.get(token);
  if (direct) return direct;

  if (token.length >= 7 && token.endsWith("ing")) {
    const stem = token.slice(0, -3);
    return SYNONYMS.get(stem) ?? stem;
  }
  if (token.length >= 6 && token.endsWith("ed")) {
    const stem = token.slice(0, -2);
    return SYNONYMS.get(stem) ?? stem;
  }
  if (token.length >= 6 && token.endsWith("es")) {
    const stem = token.slice(0, -2);
    return SYNONYMS.get(stem) ?? stem;
  }
  if (token.length >= 5 && token.endsWith("s")) {
    const stem = token.slice(0, -1);
    return SYNONYMS.get(stem) ?? stem;
  }
  return token;
}

function tokens(value: string): Set<string> {
  const raw = normalize(value).match(/[\p{L}\p{N}]+/gu) ?? [];
  const result = new Set<string>();
  for (const token of raw) {
    if (token.length < 3 || STOPWORDS.has(token)) continue;
    const rooted = tokenRoot(token);
    if (rooted.length < 3 || STOPWORDS.has(rooted)) continue;
    result.add(rooted);
  }
  return result;
}

function overlap(left: Set<string>, right: Set<string>): { shared: number; containment: number } {
  if (!left.size || !right.size) return { shared: 0, containment: 0 };
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return { shared, containment: shared / Math.min(left.size, right.size) };
}

function publishedDistanceMs(a: ArticleCandidate, b: ArticleCandidate): number | null {
  if (!a.publishedAt || !b.publishedAt) return null;
  const at = Date.parse(a.publishedAt);
  const bt = Date.parse(b.publishedAt);
  if (!Number.isFinite(at) || !Number.isFinite(bt)) return null;
  return Math.abs(at - bt);
}

export function nearDuplicateStory(a: ArticleCandidate, b: ArticleCandidate): boolean {
  const distance = publishedDistanceMs(a, b);
  if (distance !== null && distance > 7 * 24 * 60 * 60 * 1000) return false;

  if (a.eventCountry && b.eventCountry && a.eventCountry !== b.eventCountry) return false;

  const aTitle = tokens(a.title);
  const bTitle = tokens(b.title);
  const title = overlap(aTitle, bTitle);

  if (title.shared >= 4 && title.containment >= 0.35) return true;

  if (title.shared < 2) return false;

  const aAll = tokens(`${a.title} ${a.summary ?? ""}`);
  const bAll = tokens(`${b.title} ${b.summary ?? ""}`);
  const all = overlap(aAll, bAll);

  return title.shared >= 3 && all.shared >= 7 && all.containment >= 0.28;
}

/**
 * Removes near-identical cross-publisher stories while preserving input order.
 * Callers should order candidates by preferred quality first so the best version wins.
 */
export function dedupeNearStories(candidates: ArticleCandidate[]): ArticleCandidate[] {
  const accepted: ArticleCandidate[] = [];
  for (const candidate of candidates) {
    if (accepted.some(previous => nearDuplicateStory(previous, candidate))) continue;
    accepted.push(candidate);
  }
  return accepted;
}
