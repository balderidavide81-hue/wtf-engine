import type { GameCategory } from "../domain/types.js";

export type PredictAutomationStatus =
  | "runtime-check-required"
  | "manual"
  | "research";

export type PredictSourceFormat = "json" | "html" | "database";
export type PredictSuitability = "predict" | "resolution-only" | "guardrail";

export interface PredictResolutionSource {
  id: string;
  name: string;
  authority: "official";
  categories: readonly GameCategory[];
  format: PredictSourceFormat;
  automationStatus: PredictAutomationStatus;
  suitability: PredictSuitability;
  discoveryUrl: string | null;
  resolutionUrl: string;
  allowedResolutionHosts: readonly string[];
  verifiedAt: string;
  notes: string;
}

export interface StructuredPredictEvent {
  sourceId: string;
  externalEventId: string;
  category: GameCategory;
  title: string;
  question: string;
  options: string[];
  opensAt: string;
  closesAt: string;
  resolvesAfter: string;
  resolutionUrl: string;
  resolutionRule: string;
}
