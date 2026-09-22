import type { PredictResolutionSource } from "./types.js";

export const PREDICT_SOURCES: readonly PredictResolutionSource[] = [
  {
    id: "noaa-swpc-kp",
    name: "NOAA Space Weather Prediction Center — Planetary K-index",
    authority: "official",
    category: "science",
    format: "json",
    automationStatus: "ready",
    suitability: "predict",
    discoveryUrl: "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json",
    resolutionUrl: "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
    notes:
      "Use forecast data only to create genuinely future threshold questions; resolve from later observed K-index data."
  },
  {
    id: "noaa-swpc-solar-alerts",
    name: "NOAA Space Weather Prediction Center — Space Weather Alerts",
    authority: "official",
    category: "science",
    format: "json",
    automationStatus: "ready",
    suitability: "predict",
    discoveryUrl: "https://services.swpc.noaa.gov/products/alerts.json",
    resolutionUrl: "https://services.swpc.noaa.gov/products/alerts.json",
    notes:
      "Useful for time-bounded questions about whether a named alert/threshold occurs after card creation."
  },
  {
    id: "formula1-results",
    name: "Formula 1 — Official Race Calendar and Results",
    authority: "official",
    category: "sports",
    format: "html",
    automationStatus: "manual",
    suitability: "predict",
    discoveryUrl: "https://www.formula1.com/en/racing/2026",
    resolutionUrl: "https://www.formula1.com/en/results/2026/races",
    notes:
      "High-quality sports resolution source. Initial implementation should resolve manually or with a narrowly tested parser."
  },
  {
    id: "oscars-official",
    name: "Academy Awards — Official Ceremony and Awards Database",
    authority: "official",
    category: "film-tv",
    format: "database",
    automationStatus: "manual",
    suitability: "resolution-only",
    discoveryUrl: "https://www.oscars.org/oscars",
    resolutionUrl: "https://awardsdatabase.oscars.org/",
    notes:
      "Use only after nominees/options are fixed before the ceremony. Resolve from the official Academy record."
  },
  {
    id: "christies-results",
    name: "Christie's — Official Auction Results",
    authority: "official",
    category: "culture",
    format: "html",
    automationStatus: "manual",
    suitability: "resolution-only",
    discoveryUrl: "https://www.christies.com/en/events",
    resolutionUrl: "https://www.christies.com/en/results",
    notes:
      "Good for bizarre/unusual lots when a pre-auction article supplies a future unresolved sale question."
  },
  {
    id: "guinness-records",
    name: "Guinness World Records — Official News",
    authority: "official",
    category: "records",
    format: "html",
    automationStatus: "research",
    suitability: "resolution-only",
    discoveryUrl: "https://www.guinnessworldrecords.com/news",
    resolutionUrl: "https://www.guinnessworldrecords.com/news/latest-news",
    notes:
      "Excellent editorial fit, but no public RSS/API path is enabled yet. Keep manual/research-only until access/reuse is cleared."
  },
  {
    id: "nasa-neows",
    name: "NASA Open APIs — NeoWs",
    authority: "official",
    category: "space",
    format: "json",
    automationStatus: "research",
    suitability: "quiz-story-only",
    discoveryUrl: "https://api.nasa.gov/",
    resolutionUrl: "https://api.nasa.gov/",
    notes:
      "Do not turn already-calculated future close-approach values into fake predictions. Use only when a genuinely unresolved later observation exists."
  }
] as const;

export function getPredictSource(id: string): PredictResolutionSource | undefined {
  return PREDICT_SOURCES.find(source => source.id === id);
}

export function listPredictSourcesByStatus(
  status: PredictResolutionSource["automationStatus"]
): PredictResolutionSource[] {
  return PREDICT_SOURCES.filter(source => source.automationStatus === status);
}
