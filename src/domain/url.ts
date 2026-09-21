function normalize(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith("utm_") || ["fbclid", "gclid"].includes(key)) {
        url.searchParams.delete(key);
      }
    }
    url.searchParams.sort();
    return url;
  } catch {
    return null;
  }
}

export function canonicalizeHttpUrl(raw: string): string | null {
  return normalize(raw)?.toString() ?? null;
}

export function canonicalizeUrl(raw: string): string {
  return canonicalizeHttpUrl(raw) ?? raw;
}

export function isHttpUrl(raw: string): boolean {
  return normalize(raw) !== null;
}
