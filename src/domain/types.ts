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
  /** Best-effort language of the actual title/summary content. */
  language?: string;
  /** Language configured for the source/feed edition before content detection. */
  sourceLanguage?: string;
  /** Legacy source/edition geography; prefer sourceCountry for new code. */
  country?: string;
  /** Geography of the publisher/feed edition, not necessarily where the event happened. */
  sourceCountry?: string;
  /** ISO-3166 alpha-2 code inferred only when the event geography is explicit enough. */
  eventCountry?: string;
  /** Human-readable explicit location hint associated with eventCountry. */
  eventLocation?: string;
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
