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
  url.searchParams.set("maxrecords", "50");
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
    mediaUsageStatus: "unreviewed"
  };
}

function gdeltSources(): RssSourceConfig[] {
  if (process.env.WTF_ENABLE_GDELT === "0") return [];
  return [
    gdeltSource("GDELT WTF Animals & Local Oddities", '(escaped OR wandering OR "stuck in" OR rescued OR "unexpected visitor" OR bizarre OR unusual) (animal OR zoo OR wildlife OR pet OR bird OR snake OR horse OR deer OR emu)', "animals"),
    gdeltSource("GDELT WTF Sports", '(bizarre OR unusual OR strange OR record OR mascot OR interrupted OR invasion OR stunt) (sport OR football OR soccer OR baseball OR basketball OR tennis OR race OR athlete OR referee OR stadium)', "sports"),
    gdeltSource("GDELT WTF Entertainment & Culture", '(bizarre OR unusual OR strange OR unexpected OR record OR surprise) (movie OR film OR cinema OR actor OR actress OR singer OR concert OR television OR celebrity OR museum OR art)', "culture"),
    gdeltSource("GDELT WTF Work & Technology", '(bizarre OR unusual OR strange OR unexpected OR robot OR record) (job OR workplace OR worker OR office OR profession OR factory OR restaurant OR delivery OR technology)', "work"),
    gdeltSource("GDELT WTF Records & Lost-Found", '("world record" OR "found after" OR "returned after" OR "lost for" OR "hidden for" OR "sold for" OR auction)', "records")
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
