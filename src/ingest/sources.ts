import type { RssSourceConfig } from "./rss.js";

/**
 * Source registry.
 *
 * We intentionally keep URLs configurable instead of hard-coding unverified
 * third-party feed endpoints. Add feeds only after checking access/usage terms.
 */
export function sourcesFromEnv(): RssSourceConfig[] {
  const raw = process.env.WTF_RSS_SOURCES;
  if (!raw) return [];

  return raw.split(",").flatMap(entry => {
    const [name, url, language, country] = entry.split("|").map(v => v.trim());
    if (!name || !url) return [];
    return [{ name, url, language: language || undefined, country: country || undefined }];
  });
}
