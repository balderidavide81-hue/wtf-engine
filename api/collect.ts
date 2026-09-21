import type { VercelRequest, VercelResponse } from "@vercel/node";
import { collect } from "../src/ingest/collect.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
