import type { VercelRequest } from "@vercel/node";
import { timingSafeEqual } from "node:crypto";

function bearerToken(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  if (typeof header !== "string" || !header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

export function isEditorialAuthorized(req: VercelRequest): boolean {
  const expected = process.env.EDITORIAL_API_TOKEN;
  const supplied = bearerToken(req);
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}
