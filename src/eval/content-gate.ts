import type { EditorialAuditReport } from "./editorial-audit.js";
import type { ContentGateMetricsRecord } from "../store/types.js";

export interface ContentGateDay {
  date: string;
  available: boolean;
  editionStatus: "draft" | "reviewed" | "published" | null;
  structuralPass: boolean;
  minimumActiveCardsPass: boolean;
  dayPass: boolean;
  totalCards: number;
  activeCards: number;
  errorCount: number;
  warningCount: number;
  telemetryComplete: boolean;
  cleanKeptCards: number | null;
  editedCards: number | null;
  editActions: number | null;
  rejectActions: number | null;
  estimatedGenerationCostUsd: number | null;
}

export interface ContentGateReport {
  throughDate: string;
  daysRequested: number;
  minActiveCards: number;
  editionsFound: number;
  missingDates: string[];
  structuralPassDays: number;
  minimumVolumePassDays: number;
  gatePass: boolean;
  humanEditorialReviewRequired: true;
  totalCards: number;
  activeCards: number;
  errorCount: number;
  warningCount: number;
  modes: Record<string, number>;
  interactions: Record<string, number>;
  telemetryCompleteDays: number;
  telemetryKeptCards: number;
  telemetryCleanKeptCards: number;
  telemetryEditedCards: number;
  telemetryEditActions: number;
  telemetryRejectActions: number;
  telemetryEstimatedGenerationCostUsd: number;
  telemetryCleanKeptRate: number | null;
  days: ContentGateDay[];
}

function parseIsoDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error("Invalid ISO date");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    throw new Error("Invalid ISO date");
  }
  return date;
}

function formatIsoDate(date: Date): string {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("-");
}

export function contentGateDates(throughDate: string, days: number): string[] {
  const boundedDays = Math.max(1, Math.min(Math.trunc(days), 14));
  const through = parseIsoDate(throughDate);
  return Array.from({ length: boundedDays }, (_, index) => {
    const date = new Date(through);
    date.setUTCDate(through.getUTCDate() - (boundedDays - 1 - index));
    return formatIsoDate(date);
  });
}

function addCounts(target: Record<string, number>, source: Record<string, number>): void {
  for (const [key, value] of Object.entries(source)) {
    target[key] = (target[key] ?? 0) + value;
  }
}

export function buildContentGateReport(
  throughDate: string,
  daysRequested: number,
  minActiveCards: number,
  auditReports: EditorialAuditReport[],
  metricsReports: ContentGateMetricsRecord[] = []
): ContentGateReport {
  const dates = contentGateDates(throughDate, daysRequested);
  const boundedMinActiveCards = Math.max(1, Math.min(Math.trunc(minActiveCards), 30));
  const byDate = new Map(auditReports.map(report => [report.editionDate, report]));
  const metricsByDate = new Map(metricsReports.map(report => [report.editionDate, report]));
  const modes: Record<string, number> = {};
  const interactions: Record<string, number> = {};
  const missingDates: string[] = [];

  let totalCards = 0;
  let activeCards = 0;
  let errorCount = 0;
  let warningCount = 0;
  let structuralPassDays = 0;
  let minimumVolumePassDays = 0;

  let telemetryCompleteDays = 0;
  let telemetryKeptCards = 0;
  let telemetryCleanKeptCards = 0;
  let telemetryEditedCards = 0;
  let telemetryEditActions = 0;
  let telemetryRejectActions = 0;
  let telemetryEstimatedGenerationCostUsd = 0;

  const days: ContentGateDay[] = dates.map(date => {
    const report = byDate.get(date);
    const metrics = metricsByDate.get(date);
    if (!report) {
      missingDates.push(date);
      return {
        date,
        available: false,
        editionStatus: null,
        structuralPass: false,
        minimumActiveCardsPass: false,
        dayPass: false,
        totalCards: 0,
        activeCards: 0,
        errorCount: 0,
        warningCount: 0,
        telemetryComplete: false,
        cleanKeptCards: null,
        editedCards: null,
        editActions: null,
        rejectActions: null,
        estimatedGenerationCostUsd: null
      };
    }

    totalCards += report.totalCards;
    activeCards += report.activeCards;
    errorCount += report.errorCount;
    warningCount += report.warningCount;
    addCounts(modes, report.modes);
    addCounts(interactions, report.interactions);

    const structuralPass = report.pass;
    const minimumActiveCardsPass = report.activeCards >= boundedMinActiveCards;
    if (structuralPass) structuralPassDays += 1;
    if (minimumActiveCardsPass) minimumVolumePassDays += 1;

    const telemetryComplete = metrics?.telemetryComplete === true;
    if (telemetryComplete && metrics) {
      telemetryCompleteDays += 1;
      telemetryKeptCards += metrics.keptCards;
      telemetryCleanKeptCards += metrics.cleanKeptCards;
      telemetryEditedCards += metrics.editedCards;
      telemetryEditActions += metrics.editActions;
      telemetryRejectActions += metrics.rejectActions;
      telemetryEstimatedGenerationCostUsd += metrics.estimatedGenerationCostUsd;
    }

    return {
      date,
      available: true,
      editionStatus: report.editionStatus,
      structuralPass,
      minimumActiveCardsPass,
      dayPass: structuralPass && minimumActiveCardsPass,
      totalCards: report.totalCards,
      activeCards: report.activeCards,
      errorCount: report.errorCount,
      warningCount: report.warningCount,
      telemetryComplete,
      cleanKeptCards: telemetryComplete && metrics ? metrics.cleanKeptCards : null,
      editedCards: telemetryComplete && metrics ? metrics.editedCards : null,
      editActions: telemetryComplete && metrics ? metrics.editActions : null,
      rejectActions: telemetryComplete && metrics ? metrics.rejectActions : null,
      estimatedGenerationCostUsd: telemetryComplete && metrics
        ? metrics.estimatedGenerationCostUsd
        : null
    };
  });

  const editionsFound = auditReports.filter(report => dates.includes(report.editionDate)).length;
  const gatePass =
    missingDates.length === 0
    && days.length === dates.length
    && days.every(day => day.dayPass);

  return {
    throughDate,
    daysRequested: dates.length,
    minActiveCards: boundedMinActiveCards,
    editionsFound,
    missingDates,
    structuralPassDays,
    minimumVolumePassDays,
    gatePass,
    humanEditorialReviewRequired: true,
    totalCards,
    activeCards,
    errorCount,
    warningCount,
    modes,
    interactions,
    telemetryCompleteDays,
    telemetryKeptCards,
    telemetryCleanKeptCards,
    telemetryEditedCards,
    telemetryEditActions,
    telemetryRejectActions,
    telemetryEstimatedGenerationCostUsd,
    telemetryCleanKeptRate:
      telemetryKeptCards > 0 ? telemetryCleanKeptCards / telemetryKeptCards : null,
    days
  };
}
