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

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function collect(): Promise<CollectionReport> {
  const sources = sourcesFromEnv().map(config => new RssSource(config));

  // GDELT explicitly rate-limits its hosted APIs. Avoid a five-request burst from
  // one serverless invocation while keeping normal publisher feeds fully parallel.
  let gdeltOrdinal = 0;
  const fetches = sources.map(source => {
    if (!source.name.startsWith("GDELT ")) return source.fetchCandidates();
    const startDelayMs = gdeltOrdinal++ * 1_500;
    return (async () => {
      if (startDelayMs > 0) await delay(startDelayMs);
      return source.fetchCandidates();
    })();
  });
  const settled = await Promise.allSettled(fetches);

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
