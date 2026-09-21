import type { RssSourceConfig } from "./rss.js";

const DEFAULT_SOURCES: RssSourceConfig[] = [
  {
    name: "UPI Odd News",
    url: "https://rss.upi.com/news/odd_news.rss",
    language: "en",
    country: "US"
  },
  {
    name: "Phys.org Plants & Animals",
    url: "https://phys.org/rss-feed/breaking/biology-news/plants-animals/",
    language: "en",
    country: "GLOBAL"
  },
  {
    name: "Phys.org Archaeology",
    url: "https://phys.org/rss-feed/breaking/science-news/archaeology-fossils/",
    language: "en",
    country: "GLOBAL"
  },
  {
    name: "Phys.org Space",
    url: "https://phys.org/rss-feed/breaking/space-news/",
    language: "en",
    country: "GLOBAL"
  }
];

/**
 * Source portfolio policy:
 * - built-ins must be verified machine-readable feeds before they are enabled here;
 * - WTF_RSS_SOURCES extends the portfolio without a code deploy;
 * - source discovery candidates live in docs/SOURCE_PORTFOLIO.md and are promoted
 *   only after feed availability, freshness and terms are checked.
 */
export function sourcesFromEnv(): RssSourceConfig[] {
  const raw = process.env.WTF_RSS_SOURCES;
  const extra: RssSourceConfig[] = !raw ? [] : raw.split(",").flatMap(entry => {
    const [name, url, language, country] = entry.split("|").map(v => v.trim());
    if (!name || !url) return [];
    return [{ name, url, language: language || undefined, country: country || undefined }];
  });

  const seen = new Set<string>();
  return [...DEFAULT_SOURCES, ...extra].filter(source => {
    if (seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
}
