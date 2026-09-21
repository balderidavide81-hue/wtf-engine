import { OpenAIScout, type AiUsageDiagnostics } from "../ai/scout.js";
import { OpenAIEditor, type GameCardDraft } from "../ai/editor.js";
import type { ArticleCandidate, ScoutResult } from "../domain/types.js";
import { collect, type CollectionReport } from "../ingest/collect.js";
import { diversifyQueue } from "./diversity.js";
import type { ContentStore } from "../store/content-store.js";
import { editionDateFor } from "../time/edition-date.js";

const DEFAULT_SCOUT_LIMIT = 30;

function newestFirst(a: ArticleCandidate, b: ArticleCandidate): number {
  const at = a.publishedAt ? Date.parse(a.publishedAt) : 0;
  const bt = b.publishedAt ? Date.parse(b.publishedAt) : 0;
  return bt - at;
}

function selectScoutCandidates(candidates: ArticleCandidate[], limit: number): ArticleCandidate[] {
  const sorted = [...candidates].sort(newestFirst);
  const selected: ArticleCandidate[] = [];
  const perSource = new Map<string, number>();
  const sourceCap = Math.max(2, Math.ceil(limit / 4));

  // First pass guarantees breadth when several feeds have fresh material.
  for (const candidate of sorted) {
    if (selected.length >= limit) break;
    const count = perSource.get(candidate.sourceName) ?? 0;
    if (count >= sourceCap) continue;
    selected.push(candidate);
    perSource.set(candidate.sourceName, count + 1);
  }

  // Fill unused capacity without throwing away good material from prolific sources.
  if (selected.length < limit) {
    const used = new Set(selected.map(candidate => candidate.id));
    for (const candidate of sorted) {
      if (selected.length >= limit) break;
      if (used.has(candidate.id)) continue;
      selected.push(candidate);
    }
  }
  return selected;
}

export interface DailyQueueReport {
  collection: Omit<CollectionReport, "candidates">;
  previouslyProcessed: number;
  scouted: number;
  scoutOmittedArticleIds: string[];
  editorEligible: number;
  editorSubmitted: number;
  editorOmittedArticleIds: string[];
  edited: number;
  ai: { scout: AiUsageDiagnostics; editor: AiUsageDiagnostics; totalEstimatedCostUsd: number };
  cards: GameCardDraft[];
  queue: Array<{ candidate: ArticleCandidate; scout: ScoutResult }>;
  persistence?: { runId: string; editionId?: string; editionDate: string; newCardIds: string[]; editionCardIds: string[] };
}

export async function buildDailyQueue(limit = DEFAULT_SCOUT_LIMIT, store?: ContentStore): Promise<DailyQueueReport> {
  const collection = await collect();
  const scoutLimit = Math.max(1, Math.min(limit, 30));
  const processedIds = store
    ? await store.findProcessedCandidateIds(collection.candidates)
    : new Set<string>();
  const unseenCandidates = collection.candidates.filter(candidate => !processedIds.has(candidate.id));
  const candidates = selectScoutCandidates(unseenCandidates, scoutLimit);

  const scout = new OpenAIScout();
  const batch = await scout.classifyDetailed(candidates);
  const results = batch.results;
  const candidateIds = new Set(candidates.map(candidate => candidate.id));
  const unexpectedScoutIds = results.map(result => result.articleId).filter(id => !candidateIds.has(id));
  if (unexpectedScoutIds.length > 0) {
    throw new Error(`Scout returned article IDs that were not submitted: ${unexpectedScoutIds.join(", ")}`);
  }
  const returnedScoutIds = new Set(results.map(result => result.articleId));
  const scoutOmittedArticleIds = candidates.map(candidate => candidate.id).filter(id => !returnedScoutIds.has(id));
  const byId = new Map(candidates.map(candidate => [candidate.id, candidate]));

  const rankedQueue = results
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

  const queue = diversifyQueue(rankedQueue);
  const editor = new OpenAIEditor();
  const editorEligible = queue.filter(item => item.scout.decision === "KEEP" && item.scout.evidenceStatus === "SUPPORTED").length;
  const editorSubmittedItems = queue
    .filter(item => item.scout.decision === "KEEP" && item.scout.evidenceStatus === "SUPPORTED")
    .slice(0, 12);
  const edited = await editor.draft(queue);
  const submittedIds = new Set(editorSubmittedItems.map(item => item.candidate.id));
  const returnedIds = new Set(edited.cards.map(card => card.articleId));
  const editorOmittedArticleIds = editorSubmittedItems
    .map(item => item.candidate.id)
    .filter(id => !returnedIds.has(id));
  const unexpectedEditorIds = edited.cards
    .map(card => card.articleId)
    .filter(id => !submittedIds.has(id));
  if (unexpectedEditorIds.length > 0) {
    throw new Error(`Editor returned article IDs that were not submitted: ${unexpectedEditorIds.join(", ")}`);
  }
  const totalEstimatedCostUsd = batch.usage.estimatedCostUsd + edited.usage.estimatedCostUsd;
  const { candidates: _ignored, ...collectionSummary } = collection;

  let persistence: DailyQueueReport["persistence"];
  if (store && candidates.length > 0) {
    const saved = await store.saveCompletedRun({
      collection: collectionSummary,
      candidates,
      scoutResults: results,
      cards: edited.cards,
      ai: { scout: batch.usage, editor: edited.usage, totalEstimatedCostUsd }
    });
    const editionDate = editionDateFor();
    if (saved.cardIds.length > 0) {
      const edition = await store.appendDraftEdition(editionDate, saved.cardIds);
      persistence = {
        runId: saved.runId,
        editionId: edition.id,
        editionDate,
        newCardIds: saved.cardIds,
        editionCardIds: edition.cardIds
      };
    } else {
      const edition = await store.getEdition(editionDate);
      persistence = {
        runId: saved.runId,
        ...(edition ? { editionId: edition.id } : {}),
        editionDate,
        newCardIds: [],
        editionCardIds: edition?.cardIds ?? []
      };
    }
  }

  return {
    collection: collectionSummary,
    previouslyProcessed: processedIds.size,
    scouted: candidates.length,
    scoutOmittedArticleIds,
    editorEligible,
    editorSubmitted: editorSubmittedItems.length,
    editorOmittedArticleIds,
    edited: edited.cards.length,
    ai: { scout: batch.usage, editor: edited.usage, totalEstimatedCostUsd },
    cards: edited.cards,
    queue,
    ...(persistence ? { persistence } : {})
  };
}
