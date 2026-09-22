import type { VercelRequest } from "@vercel/node";
import { hasBearerSecret } from "./bearer.js";

export function isEditorialAuthorized(req: VercelRequest): boolean {
  return hasBearerSecret(req, process.env.EDITORIAL_API_TOKEN);
}
