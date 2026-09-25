import type { VercelRequest } from "@vercel/node";
import { createPublicKey, verify as verifySignature } from "node:crypto";

const ISSUER = "https://token.actions.githubusercontent.com";
const JWKS_URL = "https://token.actions.githubusercontent.com/.well-known/jwks";
const AUDIENCE = "wtf-engine-daily";
const REPOSITORY = "balderidavide81-hue/wtf-engine";
const REPOSITORY_ID = "1378812314";
const REF = "refs/heads/main";
const EVENT_NAME = "workflow_dispatch";
const WORKFLOW_REF =
  "balderidavide81-hue/wtf-engine/.github/workflows/generate-daily.yml@refs/heads/main";

interface JwtHeader {
  alg?: string;
  kid?: string;
}

interface JwtClaims {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  repository?: string;
  repository_id?: string;
  ref?: string;
  event_name?: string;
  workflow_ref?: string;
}

interface Jwk {
  kid?: string;
  kty?: string;
  use?: string;
  alg?: string;
  [key: string]: unknown;
}

interface JwksResponse {
  keys?: Jwk[];
}

let cachedJwks: { expiresAt: number; keys: Jwk[] } | null = null;

function bearerToken(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  if (typeof header !== "string" || !header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

function decodeJson<T>(segment: string): T | null {
  try {
    return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function audienceMatches(aud: string | string[] | undefined): boolean {
  return typeof aud === "string" ? aud === AUDIENCE : Array.isArray(aud) && aud.includes(AUDIENCE);
}

function claimsMatch(claims: JwtClaims): boolean {
  const now = Math.floor(Date.now() / 1000);
  const skew = 60;

  if (claims.iss !== ISSUER || !audienceMatches(claims.aud)) return false;
  if (typeof claims.exp !== "number" || claims.exp < now - skew) return false;
  if (typeof claims.nbf === "number" && claims.nbf > now + skew) return false;
  if (typeof claims.iat === "number" && claims.iat > now + skew) return false;

  return (
    claims.repository === REPOSITORY
    && String(claims.repository_id ?? "") === REPOSITORY_ID
    && claims.ref === REF
    && claims.event_name === EVENT_NAME
    && claims.workflow_ref === WORKFLOW_REF
  );
}

async function loadJwks(): Promise<Jwk[]> {
  const now = Date.now();
  if (cachedJwks && cachedJwks.expiresAt > now) return cachedJwks.keys;

  const response = await fetch(JWKS_URL, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5_000)
  });
  if (!response.ok) throw new Error(`GitHub JWKS HTTP ${response.status}`);

  const payload = await response.json() as JwksResponse;
  const keys = Array.isArray(payload.keys) ? payload.keys : [];
  if (!keys.length) throw new Error("GitHub JWKS returned no keys");

  cachedJwks = { expiresAt: now + 10 * 60 * 1000, keys };
  return keys;
}

export async function isGitHubDailyWorkflowAuthorized(req: VercelRequest): Promise<boolean> {
  const token = bearerToken(req);
  if (!token || token.length > 16_384) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const header = decodeJson<JwtHeader>(parts[0]);
  const claims = decodeJson<JwtClaims>(parts[1]);
  if (!header || !claims || header.alg !== "RS256" || !header.kid) return false;

  // Cheap claim checks happen before remote key retrieval. Signature verification remains mandatory.
  if (!claimsMatch(claims)) return false;

  try {
    const keys = await loadJwks();
    const jwk = keys.find(key =>
      key.kid === header.kid
      && key.kty === "RSA"
      && (key.use === undefined || key.use === "sig")
      && (key.alg === undefined || key.alg === "RS256")
    );
    if (!jwk) return false;

    const publicKey = createPublicKey({ key: jwk as any, format: "jwk" });
    return verifySignature(
      "RSA-SHA256",
      Buffer.from(`${parts[0]}.${parts[1]}`),
      publicKey,
      Buffer.from(parts[2], "base64url")
    );
  } catch (error) {
    console.error("github_oidc_verification_failed", error);
    return false;
  }
}
