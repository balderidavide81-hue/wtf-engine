import type { VercelRequest, VercelResponse } from "@vercel/node";
import { NeonContentStore } from "../src/store/neon-content-store.js";
import { editionDateFromQuery } from "../src/time/edition-date.js";
import { isEditorialAuthorized } from "../src/auth/editorial.js";
import { auditEditorialEdition } from "../src/eval/editorial-audit.js";
import { buildContentGateReport, contentGateDates } from "../src/eval/content-gate.js";

function boundedInteger(
  value: string | string[] | undefined,
  fallback: number,
  min: number,
  max: number
): number | null {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return null;
  return parsed;
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

  const throughDate = editionDateFromQuery(req.query.through);
  const days = boundedInteger(req.query.days, 7, 1, 14);
  const minActiveCards = boundedInteger(req.query.minActive, 5, 1, 30);

  if (!throughDate) return res.status(400).json({ error: "invalid_through_date" });
  if (days === null) return res.status(400).json({ error: "invalid_days" });
  if (minActiveCards === null) return res.status(400).json({ error: "invalid_min_active" });
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "persistence_not_configured" });
  }

  try {
    const store = new NeonContentStore();
    const dates = contentGateDates(throughDate, days);
    const [editions, metrics] = await Promise.all([
      Promise.all(dates.map(date => store.getEditorialEdition(date))),
      Promise.all(dates.map(date => store.getContentGateMetrics(date)))
    ]);
    const audits = editions.flatMap(edition =>
      edition ? [auditEditorialEdition(edition)] : []
    );
    const metricReports = metrics.flatMap(report => report ? [report] : []);

    return res.status(200).json(
      buildContentGateReport(throughDate, days, minActiveCards, audits, metricReports)
    );
  } catch (error) {
    console.error("content_gate_failed", error);
    return res.status(500).json({
      error: "content_gate_failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
