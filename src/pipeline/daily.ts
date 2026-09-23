import { OpenAIScout, SCOUT_BATCH_LIMIT, type AiUsageDiagnostics } from "../ai/scout.js";
import {
  OpenAIEditor,
  EDITOR_BATCH_LIMIT,
  balanceResolvedAnswerPositions,
  validateCardDraft,
  type GameCardDraft
} from "../ai/editor.js";
import type { ArticleCandidate, ScoutResult } from "../domain/types.js";
import { collect, type CollectionReport } from "../ingest/collect.js";
import { diversifyQueue, editorialLane } from "./diversity.js";
import type { ContentStore } from "../store/content-store.js";
import { editionDateFor } from "../time/edition-date.js";
import { sourceGeography } from "../geo/extract.js";
import { comparePreScoutPriority, preScoutPlayability } from "./playability.js";
import { dedupeNearStories } from "../filters/story-dedupe.js";

const DEFAULT_SCOUT_LIMIT = SCOUT_BATCH_LIMIT;

export function splitEditorBatches<T>(items: T[], batchSize = EDITOR_BATCH_LIMIT): T[][] {
  const size = Math.max(1, Math.min(Math.trunc(batchSize), EDITOR_BATCH_LIMIT));
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

export function combineAiUsageDiagnostics(usages: AiUsageDiagnostics[]): AiUsageDiagnostics {
  const first = usages[0];
  if (!first) throw new Error("Cannot combine empty AI usage diagnostics");
  for (const usage of usages) {
    if (usage.model !== first.model) {
      throw new Error(`Cannot combine Editor usage across models: ${first.model} vs ${usage.model}`);
    }
  }
  return {
    ...first,
    inputTokens: usages.reduce((sum, usage) => sum + usage.inputTokens, 0),
    cachedInputTokens: usages.reduce((sum, usage) => sum + usage.cachedInputTokens, 0),
    outputTokens: usages.reduce((sum, usage) => sum + usage.outputTokens, 0),
    totalTokens: usages.reduce((sum, usage) => sum + usage.totalTokens, 0),
    estimatedCostUsd: usages.reduce((sum, usage) => sum + usage.estimatedCostUsd, 0)
  };
}

export function selectScoutCandidates(candidates: ArticleCandidate[], limit: number): ArticleCandidate[] {
  // Order by deterministic quality first, then drop paraphrased cross-source
  // versions of the same event so the paid Scout window sees one story once.
  const sorted = dedupeNearStories([...candidates].sort(comparePreScoutPriority));
  const selected: ArticleCandidate[] = [];
  const used = new Set<string>();
  const perSource = new Map<string, number>();
  const perLane = new Map<string, number>();
  const perCountry = new Map<string, number>();
  const perLanguage = new Map<string, number>();
  const sourceCap = Math.max(2, Math.ceil(limit / 5));
  const laneCap = Math.max(2, Math.ceil(limit / 6));
  const countryCap = Math.max(2, Math.ceil(limit / 5));
  const qualityTarget = Math.max(1, Math.ceil(limit * 2 / 3));
  const minimumQualityScore = 10;

  const add = (candidate: ArticleCandidate) => {
    selected.push(candidate);
    used.add(candidate.id);
    perSource.set(candidate.sourceName, (perSource.get(candidate.sourceName) ?? 0) + 1);
    const lane = editorialLane(candidate);
    perLane.set(lane, (perLane.get(lane) ?? 0) + 1);
    const country = sourceGeography(candidate);
    perCountry.set(country, (perCountry.get(country) ?? 0) + 1);
    const language = candidate.language?.trim() || "UNKNOWN";
    perLanguage.set(language, (perLanguage.get(language) ?? 0) + 1);
  };

  const isQualityCandidate = (candidate: ArticleCandidate) =>
    preScoutPlayability(candidate).score >= minimumQualityScore;

  const countryWithinCap = (candidate: ArticleCandidate) => {
    const country = sourceGeography(candidate);
    // GLOBAL/AFRICA/UNKNOWN are source regions, not countries. Publisher caps
    // already protect diversity there; do not let one regional label block
    // unrelated global publishers.
    if (!/^[A-Z]{2}$/.test(country)) return true;
    return (perCountry.get(country) ?? 0) < countryCap;
  };

  // Pass 1: reserve roughly two thirds of the paid window for candidates with
  // deterministic playability signals while protecting publisher/topic/geography breadth.
  for (const candidate of sorted) {
    if (selected.length >= qualityTarget) break;
    if (!isQualityCandidate(candidate)) continue;
    const lane = editorialLane(candidate);
    const country = sourceGeography(candidate);
    if ((perSource.get(candidate.sourceName) ?? 0) >= sourceCap) continue;
    if ((perLane.get(lane) ?? 0) >= laneCap) continue;
    if (!countryWithinCap(candidate)) continue;
    add(candidate);
  }

  // Pass 2: keep quality and source/geography breadth, relaxing only topic pressure.
  for (const candidate of sorted) {
    if (selected.length >= qualityTarget) break;
    if (used.has(candidate.id) || !isQualityCandidate(candidate)) continue;
    const country = sourceGeography(candidate);
    if ((perSource.get(candidate.sourceName) ?? 0) >= sourceCap) continue;
    if (!countryWithinCap(candidate)) continue;
    add(candidate);
  }

  // Pass 3: use the exploration budget to cover source languages that the
  // quality block did not represent, when live candidates are available.
  const availableLanguages = new Set(
    sorted.map(candidate => candidate.language?.trim()).filter((value): value is string => Boolean(value))
  );
  for (const language of availableLanguages) {
    if (selected.length >= limit) break;
    if ((perLanguage.get(language) ?? 0) > 0) continue;
    const candidate = sorted.find(item =>
      !used.has(item.id)
      && item.language?.trim() === language
      && (perSource.get(item.sourceName) ?? 0) < sourceCap
      && countryWithinCap(item)
    );
    if (candidate) add(candidate);
  }

  // Pass 4: spend the remaining exploration slots while retaining publisher/geography breadth.
  for (const candidate of sorted) {
    if (selected.length >= limit) break;
    if (used.has(candidate.id)) continue;
    const country = sourceGeography(candidate);
    if ((perSource.get(candidate.sourceName) ?? 0) >= sourceCap) continue;
    if (!countryWithinCap(candidate)) continue;
    add(candidate);
  }

  // Pass 5: never leave paid capacity unused when the discovery pool is smaller/imbalanced.
  for (const candidate of sorted) {
    if (selected.length >= limit) break;
    if (used.has(candidate.id)) continue;
    add(candidate);
  }

  return selected;
}

export interface DailyQueueReport {
  collection: Omit<CollectionReport, "candidates">;
  previouslyProcessed: number;
  previouslyKnownStories: number;
  scouted: number;
  scoutOmittedArticleIds: string[];
  editorEligible: number;
  editorSubmitted: number;
  editorOmittedArticleIds: string[];
  edited: number;
  ai: { scout: AiUsageDiagnostics; editor: AiUsageDiagnostics; totalEstimatedCostUsd: number };
  cards: GameCardDraft[];
  queue: Array<{ candidate: ArticleCandidate; scout: ScoutResult }>;
  persistence?: {
    runId: string;
    editionId?: string;
    editionDate: string;
    newCardIds: string[];
    editionCardIds: string[];
  };
}

export async function buildDailyQueue(
  limit = DEFAULT_SCOUT_LIMIT,
  store?: ContentStore
): Promise<DailyQueueReport> {
  const editionDate = store ? editionDateFor() : undefined;
  if (store && editionDate) {
    const existingEdition = await store.getEdition(editionDate);
    if (existingEdition && existingEdition.status !== "draft") {
      throw new Error(`Edition ${editionDate} is ${existingEdition.status}; generation is closed`);
    }
  }

  const collection = await collect();
  const scoutLimit = Math.max(1, Math.min(limit, SCOUT_BATCH_LIMIT));

  const processedIds = store
    ? await store.findProcessedCandidateIds(collection.candidates)
    : new Set<string>();

  const knownStoryIds = store
    ? await store.findKnownStoryCandidateIds(collection.candidates)
    : new Set<string>();

  const unseenCandidates = collection.candidates.filter(candidate =>
    !processedIds.has(candidate.id) && !knownStoryIds.has(candidate.id)
  );
  const candidates = selectScoutCandidates(unseenCandidates, scoutLimit);

  const scout = new OpenAIScout();
  const batch = await scout.classifyDetailed(candidates);
  const results = batch.results;
  const candidateIds = new Set(candidates.map(candidate => candidate.id));
  const unexpectedScoutIds = results
    .map(result => result.articleId)
    .filter(id => !candidateIds.has(id));
  if (unexpectedScoutIds.length > 0) {
    throw new Error(`Scout returned article IDs that were not submitted: ${unexpectedScoutIds.join(", ")}`);
  }

  const returnedScoutIds = new Set(results.map(result => result.articleId));
  const scoutOmittedArticleIds = candidates
    .map(candidate => candidate.id)
    .filter(id => !returnedScoutIds.has(id));
  if (scoutOmittedArticleIds.length > 0) {
    throw new Error(`Scout omitted submitted article IDs: ${scoutOmittedArticleIds.join(", ")}`);
  }

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
  const editorSubmittedItems = queue.filter(
    item => item.scout.decision === "KEEP" && item.scout.evidenceStatus === "SUPPORTED"
  );
  const editorEligible = editorSubmittedItems.length;

  const editorInputBatches = splitEditorBatches(editorSubmittedItems);
  const editorBatchResults = editorInputBatches.length > 0
    ? await Promise.all(
        editorInputBatches.map(items => editor.draft(items, EDITOR_BATCH_LIMIT))
      )
    : [await editor.draft([], EDITOR_BATCH_LIMIT)];

  const combinedEditorCards = balanceResolvedAnswerPositions(
    editorBatchResults.flatMap(batchResult => batchResult.cards)
  );
  for (const card of combinedEditorCards) validateCardDraft(card);

  const edited = {
    cards: combinedEditorCards,
    usage: combineAiUsageDiagnostics(editorBatchResults.map(batchResult => batchResult.usage))
  };

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

  const editorInputById = new Map(editorSubmittedItems.map(item => [item.candidate.id, item]));
  const unsupportedEditorModes = edited.cards.filter(card => {
    const input = editorInputById.get(card.articleId);
    return !input || !input.scout.modes.includes(card.mode);
  });
  if (unsupportedEditorModes.length > 0) {
    throw new Error(
      `Editor selected modes not supported by Scout: ${unsupportedEditorModes
        .map(card => `${card.articleId}:${card.mode}`)
        .join(", ")}`
    );
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

    if (!editionDate) throw new Error("Edition date was not initialized for persisted generation");
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
    previouslyKnownStories: knownStoryIds.size,
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
