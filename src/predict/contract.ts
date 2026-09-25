import { getPredictSource } from "./sources.js";
import type { StructuredPredictEvent } from "./types.js";

const ISO_TIMESTAMP_WITH_ZONE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

function parseTimestamp(label: string, value: string): number {
  if (!ISO_TIMESTAMP_WITH_ZONE.test(value)) {
    throw new Error(`Predict ${label} must be an ISO timestamp with timezone`);
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Predict ${label} is invalid`);
  }
  return parsed;
}

function normalizeOption(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function normalizedHost(url: URL): string {
  return url.hostname.toLocaleLowerCase();
}

export function assertStructuredPredictEvent(event: StructuredPredictEvent): void {
  if (!event.sourceId.trim()) throw new Error("Predict sourceId is required");
  if (!event.externalEventId.trim()) throw new Error("Predict externalEventId is required");
  if (!event.title.trim()) throw new Error("Predict title is required");
  if (!event.question.trim()) throw new Error("Predict question is required");
  if (!event.resolutionRule.trim()) throw new Error("Predict resolutionRule is required");

  if (event.options.length < 2 || event.options.length > 4) {
    throw new Error("Predict events require 2-4 outcome options");
  }
  const options = event.options.map(normalizeOption);
  if (options.some(option => !option)) {
    throw new Error("Predict options cannot be empty");
  }
  if (new Set(options).size !== options.length) {
    throw new Error("Predict options must be unique");
  }

  const source = getPredictSource(event.sourceId);
  if (!source) {
    throw new Error(`Unknown Predict sourceId: ${event.sourceId}`);
  }
  if (source.suitability === "guardrail") {
    throw new Error(`Predict source ${event.sourceId} is guardrail-only`);
  }
  if (!source.categories.includes(event.category)) {
    throw new Error(
      `Predict category ${event.category} is not supported by source ${event.sourceId}`
    );
  }

  const opensAt = parseTimestamp("opensAt", event.opensAt);
  const closesAt = parseTimestamp("closesAt", event.closesAt);
  const resolvesAfter = parseTimestamp("resolvesAfter", event.resolvesAfter);
  if (!(opensAt < closesAt)) {
    throw new Error("Predict closesAt must be after opensAt");
  }
  if (!(closesAt <= resolvesAfter)) {
    throw new Error("Predict resolvesAfter must not precede closesAt");
  }

  let resolutionUrl: URL;
  try {
    resolutionUrl = new URL(event.resolutionUrl);
  } catch {
    throw new Error("Predict resolutionUrl must be a valid URL");
  }
  if (resolutionUrl.protocol !== "https:" && resolutionUrl.protocol !== "http:") {
    throw new Error("Predict resolutionUrl must be HTTP(S)");
  }

  const host = normalizedHost(resolutionUrl);
  const allowed = source.allowedResolutionHosts.some(
    candidate => host === candidate || host.endsWith(`.${candidate}`)
  );
  if (!allowed) {
    throw new Error(
      `Predict resolutionUrl host ${host} is not allowed for source ${event.sourceId}`
    );
  }
}
