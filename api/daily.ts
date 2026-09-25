import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildDailyQueue } from "../src/pipeline/daily.js";
import { NeonContentStore } from "../src/store/neon-content-store.js";
import { hasBearerSecret } from "../src/auth/bearer.js";
import { isGitHubDailyWorkflowAuthorized } from "../src/auth/github-oidc.js";
import { SCOUT_BATCH_LIMIT } from "../src/ai/scout.js";
import { DAILY_GENERATION_LEASE_KEY, DAILY_GENERATION_LEASE_TTL_SECONDS } from "../src/store/lease-constants.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const authorized =
    hasBearerSecret(req, process.env.GENERATION_API_TOKEN)
    || await isGitHubDailyWorkflowAuthorized(req);
  if (!authorized) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const requested = Number(req.query.limit ?? SCOUT_BATCH_LIMIT);
  const limit = Number.isFinite(requested) ? Math.max(1, Math.min(Math.trunc(requested), SCOUT_BATCH_LIMIT)) : SCOUT_BATCH_LIMIT;

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "persistence_not_configured" });
  }

  const store = new NeonContentStore();
  const leaseKey = DAILY_GENERATION_LEASE_KEY;
  let leaseOwner: string | null = null;

  try {
    leaseOwner = await store.tryAcquireGenerationLease(leaseKey, DAILY_GENERATION_LEASE_TTL_SECONDS);
    if (!leaseOwner) {
      return res.status(409).json({ error: "generation_already_running" });
    }
    const report = await buildDailyQueue(limit, store);
    return res.status(200).json(report);
  } catch (error) {
    console.error("daily_queue_failed", error);
    return res.status(500).json({
      error: "daily_queue_failed",
      message: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (leaseOwner) {
      try {
        await store.releaseGenerationLease(leaseKey, leaseOwner);
      } catch (releaseError) {
        console.error("generation_lease_release_failed", releaseError);
      }
    }
  }
}
