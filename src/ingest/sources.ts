import type { GameCategory } from "../domain/types.js";
import type { RssSourceConfig } from "./rss.js";
import { canonicalizeHttpUrl } from "../domain/url.js";

const DIRECT_SOURCES: RssSourceConfig[] = [
  { name: "UPI Odd News", url: "https://rss.upi.com/news/odd_news.rss", language: "en", country: "US", discoverySource: "UPI Odd News", mediaUsageStatus: "unreviewed" },
  { name: "Phys.org Plants & Animals", url: "https://phys.org/rss-feed/breaking/biology-news/plants-animals/", language: "en", country: "GLOBAL", categoryHint: "animals", mediaUsageStatus: "unreviewed" },
  { name: "Phys.org Archaeology", url: "https://phys.org/rss-feed/breaking/science-news/archaeology-fossils/", language: "en", country: "GLOBAL", categoryHint: "history-archaeology", mediaUsageStatus: "unreviewed" },
  { name: "Phys.org Space", url: "https://phys.org/rss-feed/breaking/space-news/", language: "en", country: "GLOBAL", categoryHint: "space", mediaUsageStatus: "unreviewed" },
  { name: "New Atlas Science", url: "https://refractor.io/science/index.rss", language: "en", country: "GLOBAL", categoryHint: "science", mediaUsageStatus: "unreviewed" },
  { name: "New Atlas Technology", url: "https://newatlas.com/technology/index.rss", language: "en", country: "GLOBAL", categoryHint: "technology", mediaUsageStatus: "unreviewed" },
  { name: "New Atlas Transport", url: "https://newatlas.com/transport/index.rss", language: "en", country: "GLOBAL", categoryHint: "transport", mediaUsageStatus: "unreviewed" }
];

function gdeltSource(name: string, query: string, categoryHint: GameCategory): RssSourceConfig {
  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", query);
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("maxrecords", "30");
  url.searchParams.set("timespan", "48h");
  url.searchParams.set("sort", "datedesc");
  url.searchParams.set("format", "rss");
  return {
    name,
    url: url.toString(),
    country: "GLOBAL",
    discoverySource: name,
    categoryHint,
    sourceNameStrategy: "item-or-hostname",
    mediaUsageStatus: "unreviewed",
    timeoutMs: 30_000
  };
}

function gdeltSources(): RssSourceConfig[] {
  if (process.env.WTF_ENABLE_GDELT === "0") return [];
  return [
    gdeltSource("GDELT WTF Animals & Local Oddities", '("escaped animal" OR "loose animal" OR "animal rescue" OR "zoo escape" OR "wildlife rescue" OR "unusual animal")', "animals"),
    gdeltSource("GDELT WTF Sports", '("bizarre sport" OR "unusual sport" OR "sports record" OR "mascot incident" OR "match interrupted" OR "pitch invasion" OR "stadium stunt")', "sports"),
    gdeltSource("GDELT WTF Entertainment & Culture", '("bizarre film" OR "unusual movie" OR "strange concert" OR "celebrity surprise" OR "museum discovery" OR "art auction")', "culture"),
    gdeltSource("GDELT WTF Work & Technology", '("unusual job" OR "bizarre job" OR "workplace incident" OR "robot worker" OR "delivery robot" OR "restaurant robot" OR "office record")', "work"),
    gdeltSource("GDELT WTF Records & Lost-Found", '("world record" OR "found after" OR "returned after" OR "lost for" OR "hidden for" OR "sold for")', "records")
  ];
}

export function sourcesFromEnv(): RssSourceConfig[] {
  const raw = process.env.WTF_RSS_SOURCES;
  const extra: RssSourceConfig[] = !raw ? [] : raw.split(",").flatMap(entry => {
    const [name, rawUrl, language, country] = entry.split("|").map(v => v.trim());
    const url = rawUrl ? canonicalizeHttpUrl(rawUrl) : null;
    if (!name || !url) return [];
    return [{ name, url, language: language || undefined, country: country || undefined, discoverySource: name, mediaUsageStatus: "unreviewed" }];
  });

  const seen = new Set<string>();
  return [...DIRECT_SOURCES, ...gdeltSources(), ...extra].filter(source => {
    if (seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
}
