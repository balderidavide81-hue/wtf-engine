import type { ArticleCandidate, ScoutResult } from "../domain/types.js";

export type EditorialLane =
  | "animals" | "records" | "competition" | "festival" | "auction"
  | "lottery" | "food" | "science" | "transport" | "internet"
  | "pop-culture" | "lost-found" | "other";

const rules: Array<[EditorialLane, RegExp]> = [
  ["lottery", /\b(lottery|lotto|jackpot|ticket)\b/i],
  ["auction", /\b(auction|estate sale|bid|hammer price|sold for)\b/i],
  ["records", /\b(world record|guinness|record-breaking|record for)\b/i],
  ["animals", /\b(dog|cat|horse|ram|emu|moose|elk|bat|snake|alligator|chimp|fox|possum|seal|bird|fish|spider|crocodile)\b/i],
  ["competition", /\b(championship|contest|competition|tournament|race)\b/i],
  ["festival", /\b(festival|parade|celebration|tradition)\b/i],
  ["food", /\b(food|snack|pizza|burger|sandwich|cake|cheese|pepper|salt)\b/i],
  ["transport", /\b(train|plane|airport|bus|car|traffic|commuter|vehicle)\b/i],
  ["science", /\b(scientist|species|discovered|research|robot|space|dinosaur|archaeolog)\b/i],
  ["internet", /\b(viral|tiktok|meme|internet|social media)\b/i],
  ["pop-culture", /\b(actor|singer|film|movie|star trek|celebrity|music)\b/i],
  ["lost-found", /\b(overdue|returned after|found after|lost for|reunited)\b/i]
];

export function editorialLane(candidate: ArticleCandidate): EditorialLane {
  const text = `${candidate.title} ${candidate.summary ?? ""}`;
  return rules.find(([, rule]) => rule.test(text))?.[0] ?? "other";
}

export function diversifyQueue(
  items: Array<{ candidate: ArticleCandidate; scout: ScoutResult }>,
  perLane = 3
): Array<{ candidate: ArticleCandidate; scout: ScoutResult }> {
  const counts = new Map<EditorialLane, number>();
  const primary: typeof items = [];
  const overflow: typeof items = [];

  for (const item of items) {
    const lane = editorialLane(item.candidate);
    const count = counts.get(lane) ?? 0;
    if (count < perLane) {
      primary.push(item);
      counts.set(lane, count + 1);
    } else {
      overflow.push(item);
    }
  }
  return [...primary, ...overflow];
}
