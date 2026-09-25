import type { VercelRequest, VercelResponse } from "@vercel/node";
import { NeonContentStore } from "../src/store/neon-content-store.js";
import { editionDateFromQuery } from "../src/time/edition-date.js";
import { isEditorialAuthorized } from "../src/auth/editorial.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!isEditorialAuthorized(req)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "persistence_not_configured" });
  }

  const scope = req.query.scope;
  if (scope === "gameplay") {
    const rawHours = req.query.hours;
    const hours = rawHours === undefined
      ? 24
      : typeof rawHours === "string" && /^\d+$/.test(rawHours)
        ? Number(rawHours)
        : NaN;

    if (!Number.isInteger(hours) || hours < 1 || hours > 168) {
      return res.status(400).json({ error: "invalid_hours" });
    }

    try {
      return res.status(200).json(await new NeonContentStore().getGameplayMetrics(hours));
    } catch (error) {
      console.error("gameplay_metrics_failed", error);
      return res.status(500).json({
        error: "gameplay_metrics_failed",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  if (scope !== undefined) {
    return res.status(400).json({ error: "invalid_metrics_scope" });
  }

  const date = editionDateFromQuery(req.query.date);
  if (!date) return res.status(400).json({ error: "invalid_edition_date" });

  try {
    const metrics = await new NeonContentStore().getContentGateMetrics(date);
    return metrics
      ? res.status(200).json(metrics)
      : res.status(404).json({ error: "edition_not_found" });
  } catch (error) {
    console.error("editorial_metrics_failed", error);
    return res.status(500).json({
      error: "editorial_metrics_failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
