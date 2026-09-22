export type ScoutDecision = "KEEP" | "MAYBE" | "REJECT";
export type GameMode = "WTF" | "PREDICT" | "STORY";
export type InteractionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "PREDICT";
export type GameCategory =
  | "animals"
  | "records"
  | "sports"
  | "film-tv"
  | "music"
  | "culture"
  | "work"
  | "science"
  | "space"
  | "technology"
  | "transport"
  | "food"
  | "travel"
  | "internet"
  | "history-archaeology"
  | "people"
  | "other";

export type MediaUsageStatus =
  | "unreviewed"
  | "link-only"
  | "remote-display"
  | "cache-allowed"
  | "owned";

export interface ArticleCandidate {
  id: string;
  sourceName: string;
  sourceUrl: string;
  title: string;
  summary?: string;
  body?: string;
  publishedAt?: string;
  language?: string;
  country?: string;
  imageUrl?: string;
  imageAlt?: string;
  discoverySource?: string;
  categoryHint?: GameCategory;
  mediaUsageStatus?: MediaUsageStatus;
}

export interface ScoutScores {
  funny: number;
  wtf: number;
  shareability: number;
  internationalAccessibility: number;
  verifiability: number;
  sensitivity: number;
}

export interface ScoutResult {
  articleId: string;
  decision: ScoutDecision;
  modes: GameMode[];
  scores: ScoutScores;
  reason: string;
  evidenceStatus: "SUPPORTED" | "UNCERTAIN" | "UNSUPPORTED";
}
