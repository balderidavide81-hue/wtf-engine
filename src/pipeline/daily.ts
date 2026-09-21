import { OpenAIScout } from "../ai/scout.js";
import type { ArticleCandidate, ScoutResult } from "../domain/types.js";
import { collect, type CollectionReport } from "../ingest/collect.js";

const DEFAULT_SCOUT_LIMIT = 30;

function newestFirst(a: ArticleCandidate, b: ArticleCandidate): number {
  const at = a.publishedAt ? Date.parse(a.publishedAt) : 0;
  const bt = b.publishedAt ? Date.parse(b.publishedAt) : 0;
  return bt - at;
}

export interface DailyQueueReport {
  collection: Omit<CollectionReport, "candidates">;
  scouted: number;
  queue: Array<{ candidate: ArticleCandidate; scout: ScoutResult }>;
}

export async function buildDailyQueue(limit = DEFAULT_SCOUT_LIMIT): Promise<DailyQueueReport> {
  const collection = await collect();
  const candidates = [...collection.candidates].sort(newestFirst).slice(0, Math.max(1, Math.min(limit, 30)));

  const scout = new OpenAIScout();
  const results = await scout.classify(candidates);
  const byId = new Map(candidates.map(candidate => [candidate.id, candidate]));

  const queue = results
    .map(result => ({ candidate: byId.get(result.articleId), scout: result }))
    .filter((item): item is { candidate: ArticleCandidate; scout: ScoutResult } => Boolean(item.candidate))
    .sort((a, b) => {
      const rank = { KEEP: 2, MAYBE: 1, REJECT: 0 };
      const decision = rank[b.scout.decision] - rank[a.scout.decision];
      if (decision !== 0) return decision;
      const aScore = a.scout.scores.wtf + a.scout.scores.funny + a.scout.scores.shareability;
      const bScore = b.scout.scores.wtf + b.scout.scores.funny + b.scout.scores.shareability;
      return bScore - aScore;
    });

  const { candidates: _ignored, ...collectionSummary } = collection;
  return { collection: collectionSummary, scouted: candidates.length, queue };
}
