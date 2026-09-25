import { validateCardDraft, type GameCardDraft } from "../ai/editor.js";
import type { EditorialCardRecord, EditorialEditionRecord } from "../store/types.js";

export type AuditSeverity = "error" | "warning";

export interface EditorialAuditIssue {
  code: string;
  severity: AuditSeverity;
  message: string;
  cardId?: string;
}

export interface AnswerPositionAudit {
  interactionType: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  optionCount: number;
  total: number;
  counts: number[];
  balanced: boolean;
}

export interface EditorialAuditReport {
  editionDate: string;
  editionStatus: EditorialEditionRecord["status"];
  totalCards: number;
  activeCards: number;
  rejectedCards: number;
  pass: boolean;
  errorCount: number;
  warningCount: number;
  uniqueSourceCount: number;
  topSourceShare: number;
  modes: Record<string, number>;
  interactions: Record<string, number>;
  categories: Record<string, number>;
  lifecycle: Record<string, number>;
  answerPositions: AnswerPositionAudit[];
  issues: EditorialAuditIssue[];
}

function increment(target: Record<string, number>, key: string): void {
  target[key] = (target[key] ?? 0) + 1;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function draftForValidation(card: EditorialCardRecord): GameCardDraft {
  return {
    articleId: card.articleId,
    mode: card.mode,
    interactionType: card.interactionType,
    category: card.category,
    hook: card.hook,
    question: card.question,
    options: card.options,
    correctOptionIndex:
      card.mode === "PREDICT" && (card.lifecycleStatus === "resolved" || card.lifecycleStatus === "void")
        ? null
        : card.correctOptionIndex,
    reveal: card.reveal,
    resolutionRule: card.resolutionRule
  };
}

function duplicateIssues(
  cards: EditorialCardRecord[],
  selector: (card: EditorialCardRecord) => string,
  code: string,
  label: string,
  severity: AuditSeverity,
  normalize: (value: string) => string = normalizeText
): EditorialAuditIssue[] {
  const groups = new Map<string, EditorialCardRecord[]>();
  for (const card of cards) {
    const key = normalize(selector(card));
    if (!key) continue;
    const group = groups.get(key) ?? [];
    group.push(card);
    groups.set(key, group);
  }

  const issues: EditorialAuditIssue[] = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const ids = group.map(card => card.id).join(", ");
    issues.push({
      code,
      severity,
      message: `${label} duplicato in ${group.length} card: ${ids}`
    });
  }
  return issues;
}

function answerPositionAudit(cards: EditorialCardRecord[]): AnswerPositionAudit[] {
  const groups = new Map<string, { interactionType: "MULTIPLE_CHOICE" | "TRUE_FALSE"; optionCount: number; counts: number[] }>();

  for (const card of cards) {
    if (
      card.correctOptionIndex === null
      || (card.interactionType !== "MULTIPLE_CHOICE" && card.interactionType !== "TRUE_FALSE")
    ) {
      continue;
    }
    const key = `${card.interactionType}:${card.options.length}`;
    const group = groups.get(key) ?? {
      interactionType: card.interactionType,
      optionCount: card.options.length,
      counts: Array.from({ length: card.options.length }, () => 0)
    };
    if (card.correctOptionIndex >= 0 && card.correctOptionIndex < group.counts.length) {
      group.counts[card.correctOptionIndex] += 1;
    }
    groups.set(key, group);
  }

  return [...groups.values()]
    .map(group => {
      const total = group.counts.reduce((sum, value) => sum + value, 0);
      const spread = group.counts.length > 0
        ? Math.max(...group.counts) - Math.min(...group.counts)
        : 0;
      return {
        ...group,
        total,
        balanced: total < group.optionCount || spread <= 1
      };
    })
    .sort((left, right) =>
      left.interactionType.localeCompare(right.interactionType) || left.optionCount - right.optionCount
    );
}

export function auditEditorialEdition(edition: EditorialEditionRecord): EditorialAuditReport {
  const issues: EditorialAuditIssue[] = [];
  const activeCards = edition.cards.filter(card => card.lifecycleStatus !== "rejected");
  const modes: Record<string, number> = {};
  const interactions: Record<string, number> = {};
  const categories: Record<string, number> = {};
  const lifecycle: Record<string, number> = {};
  const sources: Record<string, number> = {};

  for (const card of edition.cards) {
    increment(lifecycle, card.lifecycleStatus);
  }

  for (const card of activeCards) {
    increment(modes, card.mode);
    increment(interactions, card.interactionType);
    increment(categories, card.category);
    increment(sources, card.sourceName.trim() || "(unknown)");

    try {
      validateCardDraft(draftForValidation(card));
    } catch (error) {
      issues.push({
        code: "card-validation",
        severity: "error",
        cardId: card.id,
        message: error instanceof Error ? error.message : String(error)
      });
    }

    try {
      const url = new URL(card.sourceUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("unsupported protocol");
    } catch {
      issues.push({
        code: "invalid-source-url",
        severity: "error",
        cardId: card.id,
        message: "Source URL non valida o non HTTP(S)."
      });
    }

    if (
      edition.status === "draft"
      && !["draft", "reviewed"].includes(card.lifecycleStatus)
    ) {
      issues.push({
        code: "draft-edition-lifecycle-mismatch",
        severity: "error",
        cardId: card.id,
        message: `Edizione draft ma card attiva in stato ${card.lifecycleStatus}.`
      });
    }
    if (edition.status === "reviewed" && card.lifecycleStatus !== "reviewed") {
      issues.push({
        code: "reviewed-edition-lifecycle-mismatch",
        severity: "error",
        cardId: card.id,
        message: `Edizione reviewed ma card in stato ${card.lifecycleStatus}.`
      });
    }
    if (
      edition.status === "published"
      && !["published", "open", "resolved", "void"].includes(card.lifecycleStatus)
    ) {
      issues.push({
        code: "published-edition-lifecycle-mismatch",
        severity: "error",
        cardId: card.id,
        message: `Edizione published ma card attiva in stato ${card.lifecycleStatus}.`
      });
    }

    if (card.mode === "PREDICT") {
      if (
        card.lifecycleStatus === "resolved"
        && (
          card.correctOptionIndex === null
          || !Number.isInteger(card.correctOptionIndex)
          || card.correctOptionIndex < 0
          || card.correctOptionIndex >= card.options.length
        )
      ) {
        issues.push({
          code: "resolved-predict-invalid-answer",
          severity: "error",
          cardId: card.id,
          message: "PREDICT resolved senza un correctOptionIndex valido."
        });
      }
      if (card.lifecycleStatus !== "resolved" && card.correctOptionIndex !== null) {
        issues.push({
          code: "unresolved-predict-has-answer",
          severity: "error",
          cardId: card.id,
          message: "PREDICT non resolved espone già un correctOptionIndex."
        });
      }
    }
  }

  issues.push(
    ...duplicateIssues(
      activeCards,
      card => card.articleId,
      "duplicate-article",
      "Article ID",
      "error",
      value => value.trim()
    ),
    ...duplicateIssues(
      activeCards,
      card => card.sourceUrl,
      "duplicate-source-url",
      "Source URL",
      "error",
      value => value.trim().toLocaleLowerCase()
    ),
    ...duplicateIssues(activeCards, card => card.question, "duplicate-question", "Domanda", "error"),
    ...duplicateIssues(activeCards, card => card.hook, "duplicate-hook", "Hook", "warning")
  );

  const answerPositions = answerPositionAudit(activeCards);
  for (const group of answerPositions) {
    if (!group.balanced) {
      issues.push({
        code: "answer-position-imbalance",
        severity: "warning",
        message:
          `${group.interactionType} con ${group.optionCount} opzioni ha distribuzione risposte `
          + `[${group.counts.join(", ")}].`
      });
    }
  }

  const sourceCounts = Object.values(sources);
  const topSourceCount = sourceCounts.length > 0 ? Math.max(...sourceCounts) : 0;
  const topSourceShare = activeCards.length > 0 ? topSourceCount / activeCards.length : 0;
  if (activeCards.length >= 6 && topSourceShare > 0.5) {
    issues.push({
      code: "source-concentration",
      severity: "warning",
      message: `Una singola fonte copre ${Math.round(topSourceShare * 100)}% delle card attive.`
    });
  }

  const categoryCounts = Object.values(categories);
  const topCategoryCount = categoryCounts.length > 0 ? Math.max(...categoryCounts) : 0;
  const topCategoryShare = activeCards.length > 0 ? topCategoryCount / activeCards.length : 0;
  if (activeCards.length >= 6 && topCategoryShare > 0.6) {
    issues.push({
      code: "category-concentration",
      severity: "warning",
      message: `Una singola categoria copre ${Math.round(topCategoryShare * 100)}% delle card attive.`
    });
  }

  if (activeCards.length >= 10 && Object.keys(modes).length < 2) {
    issues.push({
      code: "mode-monoculture",
      severity: "warning",
      message: "Edizione con almeno 10 card ma un solo game mode."
    });
  }

  const errorCount = issues.filter(issue => issue.severity === "error").length;
  const warningCount = issues.filter(issue => issue.severity === "warning").length;

  return {
    editionDate: edition.editionDate,
    editionStatus: edition.status,
    totalCards: edition.cards.length,
    activeCards: activeCards.length,
    rejectedCards: edition.cards.length - activeCards.length,
    pass: errorCount === 0,
    errorCount,
    warningCount,
    uniqueSourceCount: Object.keys(sources).length,
    topSourceShare,
    modes,
    interactions,
    categories,
    lifecycle,
    answerPositions,
    issues
  };
}
