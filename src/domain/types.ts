export type ScoutDecision = "KEEP" | "MAYBE" | "REJECT";
export type GameMode = "WTF" | "PREDICT" | "STORY";

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
