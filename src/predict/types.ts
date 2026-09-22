import type { GameCategory } from "../domain/types.js";

export type PredictAutomationStatus = "ready" | "manual" | "research";
export type PredictSourceFormat = "json" | "html" | "database";
export type PredictSuitability = "predict" | "resolution-only" | "quiz-story-only";

export interface PredictResolutionSource {
  id: string;
  name: string;
  authority: "official";
  category: GameCategory;
  format: PredictSourceFormat;
  automationStatus: PredictAutomationStatus;
  suitability: PredictSuitability;
  discoveryUrl: string | null;
  resolutionUrl: string;
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

export function assertStructuredPredictEvent(event: StructuredPredictEvent): void {
  if (!event.sourceId.trim()) throw new Error("Predict sourceId is required");
  if (!event.externalEventId.trim()) throw new Error("Predict externalEventId is required");
  if (!event.title.trim() || !event.question.trim()) throw new Error("Predict title/question is required");
  if (event.options.length < 2 || event.options.length > 4) {
    throw new Error("Predict events require 2-4 outcome options");
  }
  const normalized = event.options.map(option => option.trim().toLocaleLowerCase());
  if (normalized.some(option => !option)) throw new Error("Predict options cannot be empty");
  if (new Set(normalized).size !== normalized.length) throw new Error("Predict options must be unique");
  for (const [label, value] of [
    ["opensAt", event.opensAt],
    ["closesAt", event.closesAt],
    ["resolvesAfter", event.resolvesAfter]
  ] as const) {
    if (Number.isNaN(Date.parse(value))) throw new Error(`Predict ${label} must be ISO date/time`);
  }
  const opensAt = Date.parse(event.opensAt);
  const closesAt = Date.parse(event.closesAt);
  const resolvesAfter = Date.parse(event.resolvesAfter);
  if (!(opensAt < closesAt)) throw new Error("Predict closesAt must be after opensAt");
  if (!(closesAt <= resolvesAfter)) throw new Error("Predict resolvesAfter must not precede closesAt");
  if (!event.resolutionRule.trim()) throw new Error("Predict resolutionRule is required");
  const url = new URL(event.resolutionUrl);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Predict resolutionUrl must be HTTP(S)");
  }
}
