import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isEditorialAuthorized } from "../src/auth/editorial.js";
import { getPredictSource, PREDICT_SOURCES } from "../src/predict/sources.js";

function publicSourceRecord(source: (typeof PREDICT_SOURCES)[number]) {
  return {
    id: source.id,
    name: source.name,
    automationStatus: source.automationStatus,
    suitability: source.suitability,
    format: source.format,
    verifiedAt: source.verifiedAt,
    resolutionUrl: source.resolutionUrl
  };
}

function hostAllowed(host: string, allowedHosts: readonly string[]): boolean {
  const normalized = host.toLocaleLowerCase();
  return allowedHosts.some(candidate =>
    normalized === candidate || normalized.endsWith(`.${candidate}`)
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!isEditorialAuthorized(req)) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const sourceId = req.query.source;
  if (sourceId === undefined) {
    return res.status(200).json({
      sources: PREDICT_SOURCES.map(publicSourceRecord)
    });
  }
  if (typeof sourceId !== "string") {
    return res.status(400).json({ error: "invalid_source" });
  }

  const source = getPredictSource(sourceId);
  if (!source) return res.status(404).json({ error: "source_not_found" });

  const startedAt = Date.now();
  try {
    const response = await fetch(source.resolutionUrl, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
      headers: {
        "User-Agent": "WTF-Engine-Predict-Source-Health/0.6.28",
        "Accept": source.format === "json"
          ? "application/json,text/plain;q=0.8,*/*;q=0.5"
          : "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5"
      }
    });

    const finalUrl = new URL(response.url);
    const finalHostAllowed = hostAllowed(finalUrl.hostname, source.allowedResolutionHosts);
    const contentType = response.headers.get("content-type");
    await response.body?.cancel();

    return res.status(200).json({
      source: publicSourceRecord(source),
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      httpStatus: response.status,
      ok: response.ok,
      finalUrl: response.url,
      finalHostAllowed,
      contentType
    });
  } catch (error) {
    return res.status(200).json({
      source: publicSourceRecord(source),
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      httpStatus: null,
      ok: false,
      finalUrl: null,
      finalHostAllowed: null,
      contentType: null,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
