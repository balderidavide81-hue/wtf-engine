import { XMLParser } from "fast-xml-parser";
import type { ArticleCandidate, GameCategory, MediaUsageStatus } from "../domain/types.js";
import type { NewsSource } from "./index.js";
import { canonicalizeHttpUrl } from "../domain/url.js";
import { extractEventGeography } from "../geo/extract.js";

export interface RssSourceConfig {
  name: string;
  url: string;
  language?: string;
  country?: string;
  discoverySource?: string;
  categoryHint?: GameCategory;
  mediaUsageStatus?: MediaUsageStatus;
  sourceNameStrategy?: "config" | "item-or-hostname";
  timeoutMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
}

type FeedItem = Record<string, unknown>;

const MAX_RSS_RESPONSE_CHARS = 2_000_000;
const MAX_RSS_ITEMS = 100;
const MAX_TITLE_CHARS = 600;
const MAX_SUMMARY_CHARS = 4_000;
const MAX_SOURCE_NAME_CHARS = 200;
const MAX_ALT_CHARS = 500;

function text(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const candidate = text(item);
      if (candidate) return candidate;
    }
    return undefined;
  }
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return text(obj["#text"]) ?? text(obj["@_href"]);
  }
  return undefined;
}

function cleanFeedText(value: unknown, maxChars: number): string | undefined {
  const raw = text(value);
  if (!raw) return undefined;
  const cleaned = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, maxChars) : undefined;
}

function itemsFrom(parsed: Record<string, any>): FeedItem[] {
  const raw = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];
  return Array.isArray(raw) ? raw : [raw];
}

function nodeUrl(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const candidate = nodeUrl(item);
      if (candidate) return candidate;
    }
    return undefined;
  }
  if (typeof value === "string") return canonicalizeHttpUrl(value) ?? undefined;
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  for (const key of ["@_url", "@_href", "url", "href"]) {
    const raw = text(obj[key]);
    const candidate = raw ? canonicalizeHttpUrl(raw) : null;
    if (candidate) return candidate;
  }
  return undefined;
}

function articleLink(item: FeedItem): string | undefined {
  const rawLinks = Array.isArray(item.link) ? item.link : item.link ? [item.link] : [];
  for (const raw of rawLinks) {
    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      const rel = text(obj["@_rel"]);
      const href = text(obj["@_href"]);
      if ((!rel || rel === "alternate") && href) {
        const canonical = canonicalizeHttpUrl(href);
        if (canonical) return canonical;
      }
    }
  }
  const fallback = text(item.link) ?? text(item.guid);
  return fallback ? canonicalizeHttpUrl(fallback) ?? undefined : undefined;
}

function imageFromHtml(value: unknown): string | undefined {
  const raw = text(value);
  if (!raw) return undefined;
  const match = /<img\b[^>]*?(?:src|data-src)\s*=\s*["']([^"']+)["']/i.exec(raw);
  return match?.[1] ? canonicalizeHttpUrl(match[1]) ?? undefined : undefined;
}

function imageFromItem(item: FeedItem): string | undefined {
  return [
    nodeUrl(item["media:content"]),
    nodeUrl(item["media:thumbnail"]),
    nodeUrl(item.enclosure),
    nodeUrl(item.image),
    imageFromHtml(item["content:encoded"]),
    imageFromHtml(item.description),
    imageFromHtml(item.summary)
  ].find(Boolean);
}

function imageAltFromItem(item: FeedItem): string | undefined {
  return cleanFeedText(item["media:title"], MAX_ALT_CHARS)
    ?? cleanFeedText(item["media:description"], MAX_ALT_CHARS);
}

function locationHintFromItem(item: FeedItem): string | undefined {
  return cleanFeedText(item["georss:featureName"], 240)
    ?? cleanFeedText(item["dc:coverage"], 240)
    ?? cleanFeedText(item["geo:location"], 240)
    ?? cleanFeedText(item.location, 240);
}

function publisherName(item: FeedItem, canonicalLink: string, config: RssSourceConfig): string {
  if (config.sourceNameStrategy !== "item-or-hostname") return config.name;
  const itemSource = cleanFeedText(item.source, MAX_SOURCE_NAME_CHARS);
  if (itemSource) return itemSource;
  try {
    return new URL(canonicalLink).hostname.replace(/^www\./, "");
  } catch {
    return config.name;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function errorDetail(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = (error as Error & { cause?: unknown }).cause;
  if (!cause || typeof cause !== "object") return error.message;
  const obj = cause as Record<string, unknown>;
  const code = typeof obj.code === "string" ? obj.code : undefined;
  const message = typeof obj.message === "string" ? obj.message : undefined;
  return [error.message, code, message].filter(Boolean).join(" / ");
}

export class RssSource implements NewsSource {
  readonly name: string;

  constructor(private readonly config: RssSourceConfig) {
    this.name = config.name;
  }

  private async fetchResponse(): Promise<Response> {
    const retryCount = Math.max(0, Math.min(this.config.retryCount ?? 0, 2));
    const retryDelayMs = Math.max(250, Math.min(this.config.retryDelayMs ?? 1_500, 10_000));
    let lastError: unknown;

    for (let attempt = 0; attempt <= retryCount; attempt += 1) {
      try {
        const response = await fetch(this.config.url, {
          headers: {
            "user-agent": "wtf-engine/0.6 (+editorial discovery)",
            "accept": "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.5"
          },
          signal: AbortSignal.timeout(this.config.timeoutMs ?? 10_000)
        });

        if (response.ok) return response;
        lastError = new Error(`${this.name}: HTTP ${response.status}`);
        const retryable = response.status === 429 || response.status >= 500;
        if (!retryable || attempt === retryCount) throw lastError;
      } catch (error) {
        lastError = error;
        if (attempt === retryCount) {
          throw new Error(`${this.name}: fetch failed (${errorDetail(error)})`);
        }
      }

      await delay(retryDelayMs * (attempt + 1));
    }

    throw new Error(`${this.name}: fetch failed (${errorDetail(lastError)})`);
  }

  async fetchCandidates(): Promise<ArticleCandidate[]> {
    const response = await this.fetchResponse();
    const declaredLength = Number(response.headers.get("content-length") ?? "0");
    if (Number.isFinite(declaredLength) && declaredLength > MAX_RSS_RESPONSE_CHARS * 2) {
      throw new Error(`${this.name}: RSS response declares excessive size`);
    }

    const xml = await response.text();
    if (xml.length > MAX_RSS_RESPONSE_CHARS) {
      throw new Error(`${this.name}: RSS response exceeds size limit`);
    }
    const parsed = new XMLParser({ ignoreAttributes: false }).parse(xml) as Record<string, any>;

    return itemsFrom(parsed).slice(0, MAX_RSS_ITEMS).flatMap(item => {
      const title = cleanFeedText(item.title, MAX_TITLE_CHARS);
      const canonicalLink = articleLink(item);
      if (!title || !canonicalLink) return [];

      const summary =
        cleanFeedText(item.description, MAX_SUMMARY_CHARS)
        ?? cleanFeedText(item.summary, MAX_SUMMARY_CHARS)
        ?? cleanFeedText(item.content, MAX_SUMMARY_CHARS);
      const geography = extractEventGeography({
        title,
        summary,
        locationHint: locationHintFromItem(item)
      });

      return [{
        id: `${this.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}:${canonicalLink}`,
        sourceName: publisherName(item, canonicalLink, this.config),
        sourceUrl: canonicalLink,
        title,
        summary,
        publishedAt: text(item.pubDate) ?? text(item.published) ?? text(item.updated),
        language: this.config.language,
        country: this.config.country,
        sourceCountry: this.config.country,
        eventCountry: geography.eventCountry,
        eventLocation: geography.eventLocation,
        imageUrl: imageFromItem(item),
        imageAlt: imageAltFromItem(item),
        discoverySource: this.config.discoverySource ?? this.config.name,
        categoryHint: this.config.categoryHint,
        mediaUsageStatus: this.config.mediaUsageStatus ?? "unreviewed"
      }];
    });
  }
}
