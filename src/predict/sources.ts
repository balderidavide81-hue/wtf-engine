import type { PredictResolutionSource, PredictAutomationStatus } from "./types.js";

export const PREDICT_SOURCES: readonly PredictResolutionSource[] = [
  {
    id: "noaa-swpc-kp",
    name: "NOAA Space Weather Prediction Center — Planetary K-index",
    authority: "official",
    categories: ["science", "space"],
    format: "json",
    automationStatus: "runtime-check-required",
    suitability: "predict",
    discoveryUrl: "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json",
    resolutionUrl: "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
    allowedResolutionHosts: ["services.swpc.noaa.gov"],
    verifiedAt: "2026-09-25",
    notes:
      "Official machine-readable source family. External verification currently receives HTTP 403, so automate only after a production-runtime accessibility probe."
  },
  {
    id: "noaa-swpc-alerts",
    name: "NOAA Space Weather Prediction Center — Alerts",
    authority: "official",
    categories: ["science", "space"],
    format: "json",
    automationStatus: "runtime-check-required",
    suitability: "predict",
    discoveryUrl: "https://services.swpc.noaa.gov/products/alerts.json",
    resolutionUrl: "https://services.swpc.noaa.gov/products/alerts.json",
    allowedResolutionHosts: ["services.swpc.noaa.gov"],
    verifiedAt: "2026-09-25",
    notes:
      "Potentially useful for time-bounded future alert questions. Must prove the outcome was absent at opening and verify server-side accessibility before automation."
  },
  {
    id: "formula1-official",
    name: "Formula 1 — Official Calendar and Race Results",
    authority: "official",
    categories: ["sports"],
    format: "html",
    automationStatus: "manual",
    suitability: "predict",
    discoveryUrl: "https://www.formula1.com/en/racing/2026",
    resolutionUrl: "https://www.formula1.com/en/results/2026/races",
    allowedResolutionHosts: ["formula1.com", "www.formula1.com"],
    verifiedAt: "2026-09-25",
    notes:
      "Use only for unusual/story-worthy angles, not routine betting inventory. Start with manual resolution against official results."
  },
  {
    id: "oscars-official",
    name: "Academy Awards — Official Oscars and Awards Database",
    authority: "official",
    categories: ["film-tv", "culture"],
    format: "database",
    automationStatus: "manual",
    suitability: "resolution-only",
    discoveryUrl: "https://www.oscars.org/oscars",
    resolutionUrl: "https://awardsdatabase.oscars.org/",
    allowedResolutionHosts: ["oscars.org", "www.oscars.org", "awardsdatabase.oscars.org"],
    verifiedAt: "2026-09-25",
    notes:
      "Official Academy record. Suitable for unusual nominee/outcome stories after options are fixed and before the ceremony resolves them."
  },
  {
    id: "christies-official",
    name: "Christie's — Official Auction Calendar and Results",
    authority: "official",
    categories: ["culture", "records", "people"],
    format: "html",
    automationStatus: "manual",
    suitability: "resolution-only",
    discoveryUrl: "https://www.christies.com/en/calendar",
    resolutionUrl: "https://www.christies.com/en/results",
    allowedResolutionHosts: ["christies.com", "www.christies.com"],
    verifiedAt: "2026-09-25",
    notes:
      "Good fit for bizarre, celebrity or historic lots when the outcome is genuinely unresolved before the auction closes."
  },
  {
    id: "guinness-records",
    name: "Guinness World Records — Official News",
    authority: "official",
    categories: ["records", "people", "animals"],
    format: "html",
    automationStatus: "research",
    suitability: "resolution-only",
    discoveryUrl: "https://www.guinnessworldrecords.com/news",
    resolutionUrl: "https://www.guinnessworldrecords.com/news/latest-news",
    allowedResolutionHosts: ["guinnessworldrecords.com", "www.guinnessworldrecords.com"],
    verifiedAt: "2026-09-25",
    notes:
      "Strong editorial fit, but keep research/manual-only until access and reuse behavior are explicitly validated."
  },
  {
    id: "nasa-neows-guardrail",
    name: "NASA Open APIs — NeoWs",
    authority: "official",
    categories: ["space", "science"],
    format: "json",
    automationStatus: "research",
    suitability: "guardrail",
    discoveryUrl: "https://api.nasa.gov/",
    resolutionUrl: "https://api.nasa.gov/",
    allowedResolutionHosts: ["api.nasa.gov"],
    verifiedAt: "2026-09-25",
    notes:
      "Guardrail source: future close-approach values are often already published predictions, so do not disguise them as unresolved PREDICT cards."
  }
] as const;

export function getPredictSource(id: string): PredictResolutionSource | undefined {
  return PREDICT_SOURCES.find(source => source.id === id);
}

export function listPredictSourcesByStatus(
  status: PredictAutomationStatus
): PredictResolutionSource[] {
  return PREDICT_SOURCES.filter(source => source.automationStatus === status);
}
