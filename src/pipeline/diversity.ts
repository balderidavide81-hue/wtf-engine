import type { ArticleCandidate, ScoutResult } from "../domain/types.js";

export type EditorialLane =
  | "animals" | "records" | "sports" | "film-tv" | "music" | "culture" | "work"
  | "festival" | "auction" | "lottery" | "food" | "science" | "space" | "technology"
  | "transport" | "internet" | "travel" | "history-archaeology" | "lost-found" | "people" | "other";

const rules: Array<[EditorialLane, RegExp]> = [
  ["lottery", /\b(lottery|lotto|jackpot|ticket)\b/i],
  ["auction", /\b(auction|estate sale|bid|hammer price|sold for)\b/i],
  ["records", /\b(world record|guinness|record-breaking|record for|record attempt)\b/i],
  ["animals", /\b(dog|cat|horse|ram|emu|moose|elk|bat|snake|alligator|chimp|fox|possum|seal|bird|fish|spider|crocodile|deer|lemur|animal|wildlife)\b/i],
  ["sports", /\b(sport|football|soccer|baseball|basketball|tennis|golf|athlete|referee|stadium|marathon|rally|dakar|race)\b/i],
  ["film-tv", /\b(film|movie|cinema|actor|actress|television|tv show|series|director)\b/i],
  ["music", /\b(singer|band|concert|album|song|music|musician)\b/i],
  ["work", /\b(job|workplace|worker|office|profession|factory|restaurant|delivery|employee|boss)\b/i],
  ["festival", /\b(festival|parade|celebration|tradition)\b/i],
  ["food", /\b(food|snack|pizza|burger|sandwich|cake|cheese|pepper|salt|cookie|restaurant)\b/i],
  ["space", /\b(space|planet|moon|asteroid|exoplanet|orbit|satellite|rocket|venus|mars)\b/i],
  ["technology", /\b(robot|ai|artificial intelligence|computer|gadget|device|technology|drone)\b/i],
  ["transport", /\b(train|plane|airport|bus|car|traffic|commuter|vehicle|highway|road)\b/i],
  ["science", /\b(scientist|species|discovered|research|biology|physics|chemistry)\b/i],
  ["internet", /\b(viral|tiktok|meme|internet|social media|streamer)\b/i],
  ["travel", /\b(travel|tourist|hotel|airport|flight|cruise|beach|island)\b/i],
  ["history-archaeology", /\b(archaeolog|ancient|fossil|roman|medieval|museum|artifact|relic)\b/i],
  ["lost-found", /\b(overdue|returned after|found after|lost for|hidden for|reunited)\b/i],
  ["culture", /\b(art|museum|culture|book|dictionary|painting|sculpture|fashion)\b/i],
  ["people", /\b(man|woman|person|couple|family|student|teacher|child|resident)\b/i]
];

export function editorialLane(candidate: ArticleCandidate): EditorialLane {
  if (candidate.categoryHint && candidate.categoryHint !== "other") {
    const map: Partial<Record<string, EditorialLane>> = {
      animals:"animals", records:"records", sports:"sports", "film-tv":"film-tv", music:"music",
      culture:"culture", work:"work", science:"science", space:"space", technology:"technology",
      transport:"transport", food:"food", travel:"travel", internet:"internet",
      "history-archaeology":"history-archaeology", people:"people"
    };
    const hinted = map[candidate.categoryHint];
    if (hinted) return hinted;
  }
  const material = `${candidate.title} ${candidate.summary ?? ""}`;
  return rules.find(([, rule]) => rule.test(material))?.[0] ?? "other";
}

export function diversifyQueue(
  items: Array<{ candidate: ArticleCandidate; scout: ScoutResult }>,
  perLane = 2
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
