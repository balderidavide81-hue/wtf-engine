import type { VercelRequest, VercelResponse } from "@vercel/node";
import { collect } from "../src/ingest/collect.js";
import { hasBearerSecret } from "../src/auth/bearer.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (!hasBearerSecret(req, process.env.GENERATION_API_TOKEN)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    const report = await collect();
    return res.status(200).json(report);
  } catch (error) {
    return res.status(500).json({
      error: "collection_failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
