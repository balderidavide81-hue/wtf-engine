import type { ArticleCandidate } from "../domain/types.js";
import { prefilter } from "../filters/pipeline.js";
import { RssSource } from "./rss.js";
import { sourcesFromEnv } from "./sources.js";

export interface CollectionReport {
  fetched: number;
  kept: number;
  candidates: ArticleCandidate[];
  errors: Array<{ source: string; error: string }>;
}

export async function collect(): Promise<CollectionReport> {
  const sources = sourcesFromEnv().map(config => new RssSource(config));
  const settled = await Promise.allSettled(sources.map(source => source.fetchCandidates()));

  const raw: ArticleCandidate[] = [];
  const errors: CollectionReport["errors"] = [];

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") raw.push(...result.value);
    else errors.push({
      source: sources[index]?.name ?? "unknown",
      error: result.reason instanceof Error ? result.reason.message : String(result.reason)
    });
  });

  const candidates = prefilter(raw);
  return { fetched: raw.length, kept: candidates.length, candidates, errors };
}
