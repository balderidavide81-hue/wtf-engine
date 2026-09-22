import type { RssSourceConfig } from "./rss.js";
import { canonicalizeHttpUrl } from "../domain/url.js";

const DIRECT_SOURCES: RssSourceConfig[] = [
  { name: "UPI Odd News", url: "https://rss.upi.com/news/odd_news.rss", language: "en", country: "US", discoverySource: "UPI Odd News", mediaUsageStatus: "unreviewed" },
  { name: "Phys.org Plants & Animals", url: "https://phys.org/rss-feed/breaking/biology-news/plants-animals/", language: "en", country: "GLOBAL", categoryHint: "animals", mediaUsageStatus: "unreviewed" },
  { name: "Phys.org Archaeology", url: "https://phys.org/rss-feed/breaking/science-news/archaeology-fossils/", language: "en", country: "GLOBAL", categoryHint: "history-archaeology", mediaUsageStatus: "unreviewed" },
  { name: "Phys.org Space", url: "https://phys.org/rss-feed/breaking/space-news/", language: "en", country: "GLOBAL", categoryHint: "space", mediaUsageStatus: "unreviewed" },
  { name: "New Atlas Science", url: "https://refractor.io/science/index.rss", language: "en", country: "GLOBAL", categoryHint: "science", mediaUsageStatus: "unreviewed" },
  { name: "New Atlas Technology", url: "https://newatlas.com/technology/index.rss", language: "en", country: "GLOBAL", categoryHint: "technology", mediaUsageStatus: "unreviewed" },
  { name: "New Atlas Transport", url: "https://newatlas.com/transport/index.rss", language: "en", country: "GLOBAL", categoryHint: "transport", mediaUsageStatus: "unreviewed" },
  {
    name: "ScienceDaily Strange & Offbeat",
    url: "https://www.sciencedaily.com/rss/strange_offbeat.xml",
    language: "en",
    country: "GLOBAL",
    discoverySource: "ScienceDaily Strange & Offbeat",
    mediaUsageStatus: "link-only"
  },
  {
    name: "Smithsonian Smart News",
    url: "https://www.smithsonianmag.com/rss/smart-news/",
    language: "en",
    country: "GLOBAL",
    discoverySource: "Smithsonian Smart News",
    mediaUsageStatus: "link-only"
  },

  // Italy: Rai explicitly publishes title, summary and article URL by RSS and
  // documents RSS syndication for third-party blogs. Treat all media as link-only.
  {
    name: "Rai Televideo Dall'Italia",
    url: "https://www.televideo.rai.it/televideo/pub/rss140.xml",
    language: "it",
    country: "IT",
    discoverySource: "Rai Televideo Dall'Italia",
    mediaUsageStatus: "link-only"
  },
  {
    name: "Rai Televideo Culture",
    url: "https://www.televideo.rai.it/televideo/pub/rss160.xml",
    language: "it",
    country: "IT",
    discoverySource: "Rai Televideo Culture",
    categoryHint: "culture",
    mediaUsageStatus: "link-only"
  },

  // Focused regional curiosity feeds. These publishers explicitly expose free
  // category RSS feeds; WTF Engine uses only discovery metadata/canonical links.
  {
    name: "InsideEVs Italia Curiosita",
    url: "https://insideevs.it/rss/category/curiosita/",
    language: "it",
    country: "IT",
    discoverySource: "InsideEVs Italia Curiosita",
    categoryHint: "transport",
    mediaUsageStatus: "link-only"
  },
  {
    name: "Motor1 France Insolite",
    url: "https://fr.motor1.com/rss/category/weird/",
    language: "fr",
    country: "FR",
    discoverySource: "Motor1 France Insolite",
    categoryHint: "transport",
    mediaUsageStatus: "link-only"
  },
  {
    name: "Motor1 Espana Curiosidades",
    url: "https://es.motor1.com/rss/category/curiosidades/",
    language: "es",
    country: "ES",
    discoverySource: "Motor1 Espana Curiosidades",
    categoryHint: "transport",
    mediaUsageStatus: "link-only"
  },
  {
    name: "InsideEVs Brasil Curiosidades",
    url: "https://insideevs.uol.com.br/rss/category/curiosidades/",
    language: "pt-BR",
    country: "BR",
    discoverySource: "InsideEVs Brasil Curiosidades",
    categoryHint: "transport",
    mediaUsageStatus: "link-only"
  },

  // v0.6.11 regional expansion: official/public RSS endpoints from local
  // publishers. These are discovery/link sources only; no article-body reuse.
  {
    name: "Motor1 Argentina Curiosidad",
    url: "https://ar.motor1.com/rss/category/curiosidad/",
    language: "es",
    country: "AR",
    discoverySource: "Motor1 Argentina Curiosidad",
    categoryHint: "transport",
    mediaUsageStatus: "link-only",
    timeoutMs: 20_000,
    retryCount: 1,
    retryDelayMs: 1_500
  },

  // The Conversation operates local editions around the world and publishes
  // under Creative Commons. We still ingest only discovery metadata and keep
  // third-party media link-only; the original source language is preserved.
  {
    name: "The Conversation France",
    url: "https://theconversation.com/fr/articles.atom",
    language: "fr",
    country: "FR",
    discoverySource: "The Conversation France",
    mediaUsageStatus: "link-only"
  },
  {
    name: "The Conversation Spain",
    url: "https://theconversation.com/es/articles.atom",
    language: "es",
    country: "ES",
    discoverySource: "The Conversation Spain",
    mediaUsageStatus: "link-only"
  },
  {
    name: "The Conversation Brasil",
    url: "https://theconversation.com/br/articles.atom",
    language: "pt-BR",
    country: "BR",
    discoverySource: "The Conversation Brasil",
    mediaUsageStatus: "link-only"
  },
  {
    name: "The Conversation Indonesia",
    url: "https://theconversation.com/id/articles.atom",
    language: "id",
    country: "ID",
    discoverySource: "The Conversation Indonesia",
    mediaUsageStatus: "link-only"
  },
  {
    name: "The Conversation Australia",
    url: "https://theconversation.com/au/articles.atom",
    language: "en",
    country: "AU",
    discoverySource: "The Conversation Australia",
    mediaUsageStatus: "link-only"
  },
  {
    name: "The Conversation Africa",
    url: "https://theconversation.com/africa/articles.atom",
    language: "en",
    country: "AFRICA",
    discoverySource: "The Conversation Africa",
    mediaUsageStatus: "link-only"
  }
];

const GDELT_DISCOVERY_QUERY = [
  '"escaped animal"',
  '"world record"',
  '"unusual sport"',
  '"match interrupted"',
  '"strange concert"',
  '"unusual movie"',
  '"museum discovery"',
  '"unusual job"',
  '"workplace incident"',
  '"found after"',
  '"returned after"',
  '"sold for"'
].join(" OR ");

function gdeltGlobalRadar(): RssSourceConfig[] {
  // GDELT DOC 2.0 repeatedly returned HTTP 429 from the production Vercel
  // egress even after collapsing to one request. Keep the adapter available
  // for controlled experiments, but do not spend a request in normal cycles.
  if (process.env.WTF_ENABLE_GDELT !== "1") return [];

  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", `(${GDELT_DISCOVERY_QUERY})`);
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("maxrecords", "50");
  url.searchParams.set("timespan", "48h");
  url.searchParams.set("sort", "datedesc");
  url.searchParams.set("format", "rss");

  return [{
    name: "GDELT WTF Global Radar",
    url: url.toString(),
    country: "GLOBAL",
    discoverySource: "GDELT WTF Global Radar",
    sourceNameStrategy: "item-or-hostname",
    mediaUsageStatus: "unreviewed",
    timeoutMs: 20_000,
    retryCount: 1,
    retryDelayMs: 2_000
  }];
}

export function sourcesFromEnv(): RssSourceConfig[] {
  const raw = process.env.WTF_RSS_SOURCES;
  const extra: RssSourceConfig[] = !raw ? [] : raw.split(",").flatMap(entry => {
    const [name, rawUrl, language, country] = entry.split("|").map(v => v.trim());
    const url = rawUrl ? canonicalizeHttpUrl(rawUrl) : null;
    if (!name || !url) return [];
    return [{
      name,
      url,
      language: language || undefined,
      country: country || undefined,
      discoverySource: name,
      mediaUsageStatus: "unreviewed"
    }];
  });

  const seen = new Set<string>();
  return [...DIRECT_SOURCES, ...gdeltGlobalRadar(), ...extra].filter(source => {
    if (seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
}
