import { XMLParser } from "fast-xml-parser";
import type { ArticleCandidate } from "../domain/types.js";
import type { NewsSource } from "./index.js";
import { canonicalizeUrl } from "../domain/url.js";

export interface RssSourceConfig {
  name: string;
  url: string;
  language?: string;
  country?: string;
}

type FeedItem = Record<string, unknown>;

function text(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return text(obj["#text"]) ?? text(obj["@_href"]);
  }
  return undefined;
}

function itemsFrom(parsed: Record<string, any>): FeedItem[] {
  const raw = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];
  return Array.isArray(raw) ? raw : [raw];
}

export class RssSource implements NewsSource {
  readonly name: string;

  constructor(private readonly config: RssSourceConfig) {
    this.name = config.name;
  }

  async fetchCandidates(): Promise<ArticleCandidate[]> {
    const response = await fetch(this.config.url, {
      headers: { "user-agent": "wtf-engine/0.2 (+editorial prototype)" }
    });
    if (!response.ok) throw new Error(`${this.name}: HTTP ${response.status}`);

    const xml = await response.text();
    const parsed = new XMLParser({ ignoreAttributes: false }).parse(xml) as Record<string, any>;

    return itemsFrom(parsed).flatMap(item => {
      const title = text(item.title);
      const link = text(item.link) ?? text(item.guid);
      if (!title || !link) return [];

      const canonicalLink = canonicalizeUrl(link);
      return [{
        id: `${this.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}:${canonicalLink}`,
        sourceName: this.name,
        sourceUrl: canonicalLink,
        title,
        summary: text(item.description) ?? text(item.summary) ?? text(item.content),
        publishedAt: text(item.pubDate) ?? text(item.published) ?? text(item.updated),
        language: this.config.language,
        country: this.config.country
      }];
    });
  }
}
