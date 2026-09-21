import type { ArticleCandidate } from "../domain/types.js";
import { prefilterDetailed, type PrefilterReport } from "../filters/pipeline.js";
import { RssSource } from "./rss.js";
import { sourcesFromEnv } from "./sources.js";

export interface CollectionReport {
  sourceCount: number;
  fetched: number;
  kept: number;
  candidates: ArticleCandidate[];
  errors: Array<{ source: string; error: string }>;
  dropped: PrefilterReport["dropped"];
  bySource: Array<{ source: string; fetched: number }>;
}

export async function collect(): Promise<CollectionReport> {
  const sources = sourcesFromEnv().map(config => new RssSource(config));
  const settled = await Promise.allSettled(sources.map(source => source.fetchCandidates()));

  const raw: ArticleCandidate[] = [];
  const errors: CollectionReport["errors"] = [];
  const bySource: CollectionReport["bySource"] = [];

  settled.forEach((result, index) => {
    const source = sources[index]?.name ?? "unknown";
    if (result.status === "fulfilled") {
      raw.push(...result.value);
      bySource.push({ source, fetched: result.value.length });
    } else {
      errors.push({ source, error: result.reason instanceof Error ? result.reason.message : String(result.reason) });
      bySource.push({ source, fetched: 0 });
    }
  });

  const filtered = prefilterDetailed(raw);
  return {
    sourceCount: sources.length,
    fetched: raw.length,
    kept: filtered.candidates.length,
    candidates: filtered.candidates,
    errors,
    dropped: filtered.dropped,
    bySource
  };
}
