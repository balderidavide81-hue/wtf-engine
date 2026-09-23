import type { GameplayAnswerRecord } from "../store/types.js";

export interface AnswerablePublishedCard {
  id: string;
  options: string[];
  correctOptionIndex: number;
  reveal: string;
}

export function evaluatePublishedAnswer(
  card: AnswerablePublishedCard,
  selectedOptionIndex: number
): GameplayAnswerRecord {
  if (!Number.isInteger(selectedOptionIndex) || selectedOptionIndex < 0 || selectedOptionIndex >= card.options.length) {
    throw new RangeError("selectedOptionIndex is outside the card options");
  }
  if (
    !Number.isInteger(card.correctOptionIndex)
    || card.correctOptionIndex < 0
    || card.correctOptionIndex >= card.options.length
  ) {
    throw new Error("Published card has no valid resolved answer");
  }

  return {
    cardId: card.id,
    selectedOptionIndex,
    correct: selectedOptionIndex === card.correctOptionIndex,
    correctOptionIndex: card.correctOptionIndex,
    reveal: card.reveal
  };
}
