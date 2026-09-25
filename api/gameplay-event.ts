import type { VercelRequest, VercelResponse } from "@vercel/node";
import { NeonContentStore } from "../src/store/neon-content-store.js";
import type { GameplayTelemetryEventType } from "../src/store/types.js";

const SESSION_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CARD_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EVENT_TYPES = new Set<GameplayTelemetryEventType>([
  "session_started",
  "card_viewed",
  "predict_selected",
  "session_completed"
]);

function boundedInteger(value: unknown, min: number, max: number): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || Number(value) < min || Number(value) > max) return undefined;
  return Number(value);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "persistence_not_configured" });
  }

  const sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId.trim() : "";
  const eventType = req.body?.eventType as GameplayTelemetryEventType;
  const cardId = typeof req.body?.cardId === "string" ? req.body.cardId.trim() : undefined;

  if (!SESSION_ID_RE.test(sessionId)) {
    return res.status(400).json({ error: "invalid_session_id" });
  }
  if (!EVENT_TYPES.has(eventType)) {
    return res.status(400).json({ error: "invalid_event_type" });
  }
  if (cardId !== undefined && !CARD_ID_RE.test(cardId)) {
    return res.status(400).json({ error: "invalid_card_id" });
  }

  const position = boundedInteger(req.body?.position, 0, 99);
  const selectedOptionIndex = boundedInteger(req.body?.selectedOptionIndex, 0, 9);
  const totalCards = boundedInteger(req.body?.totalCards, 0, 50);
  const score = boundedInteger(req.body?.score, 0, 50);
  const answered = boundedInteger(req.body?.answered, 0, 50);
  const predictions = boundedInteger(req.body?.predictions, 0, 50);

  if (req.body?.position !== undefined && position === undefined) {
    return res.status(400).json({ error: "invalid_position" });
  }
  if (req.body?.selectedOptionIndex !== undefined && selectedOptionIndex === undefined) {
    return res.status(400).json({ error: "invalid_selected_option_index" });
  }

  if (eventType === "card_viewed" && !cardId) {
    return res.status(400).json({ error: "card_id_required" });
  }
  if (eventType === "predict_selected" && (!cardId || selectedOptionIndex === undefined)) {
    return res.status(400).json({ error: "prediction_selection_required" });
  }

  try {
    await new NeonContentStore().recordGameplayEvent({
      sessionId,
      eventType,
      cardId,
      position,
      selectedOptionIndex,
      totalCards,
      score,
      answered,
      predictions
    });
    return res.status(204).end();
  } catch (error) {
    if (error instanceof RangeError) {
      return res.status(400).json({ error: "invalid_gameplay_event", message: error.message });
    }
    console.error("gameplay_event_failed", error);
    return res.status(400).json({
      error: "gameplay_event_rejected",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
