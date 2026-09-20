import type { ArticleCandidate } from "../domain/types.js";

export interface VerificationResult {
  articleId: string;
  status: "SUPPORTED" | "UNCERTAIN" | "UNSUPPORTED";
  evidenceUrls: string[];
  note?: string;
}

export interface Verifier {
  verify(candidate: ArticleCandidate): Promise<VerificationResult>;
}
