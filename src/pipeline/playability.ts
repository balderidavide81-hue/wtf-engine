import type { ArticleCandidate } from "../domain/types.js";

export interface PreScoutPlayability {
  score: number;
  positiveSignals: string[];
  negativeSignals: string[];
}

interface SignalRule {
  label: string;
  points: number;
  pattern: RegExp;
}

const POSITIVE_RULES: SignalRule[] = [
  {
    label: "record",
    points: 24,
    pattern: /\b(world record|guinness|record[- ]breaking|record attempt|record mondiale|record du monde|récord mundial|recorde mundial|rekor dunia|primato)\b/iu
  },
  {
    label: "escaped-or-loose",
    points: 20,
    pattern: /\b(escaped?|loose|wandering|runaway|fug[ag]|scappat|échapp|en fuite|escap|suelto|solto|kabur|berkeliaran)\w*/iu
  },
  {
    label: "rescue-or-reunion",
    points: 14,
    pattern: /\b(rescu|saved|reunited|ritrovat|salvat|sauvé|retrouvé|rescat|reencontr|resgat|reencontrad|diselamatkan|ditemukan kembali)\w*/iu
  },
  {
    label: "lottery-or-prize",
    points: 15,
    pattern: /\b(lottery|lotto|jackpot|scratch[- ]off|lotteria|gratta e vinci|loterie|lotería|loteria|undian|jackpot)\b/iu
  },
  {
    label: "auction-or-found-object",
    points: 14,
    pattern: /\b(auction|estate sale|sold for|found after|lost for|hidden for|asta|vendut[oa]|ritrovat|enchères|vendu|subasta|vendid[oa]|leilão|vendido|lelang|ditemukan)\b/iu
  },
  {
    label: "explicit-weirdness",
    points: 18,
    pattern: /\b(unusual|strange|bizarre|odd|weird|unexpected|insolit[oa]|bizzarr[oa]|curios[oa]|étrange|insolite|bizarre|extrañ[oa]|insólit[oa]|inusitad[oa]|estranh[oa]|aneh|unik|tak biasa)\b/iu
  },
  {
    label: "superlative-or-first",
    points: 10,
    pattern: /\b(first[- ]ever|largest|smallest|longest|shortest|oldest|youngest|rare appearance|prima volta|più grande|più piccolo|più lungo|apparizione rara|première fois|plus grand|plus petit|apparition rare|primera vez|más grande|más pequeño|aparición rara|primeira vez|maior|menor|aparição rara|pertama kali|terbesar|terkecil|kemunculan langka)\b/iu
  },
  {
    label: "animal-event",
    points: 8,
    pattern: /\b(deer|emu|horse|chimp|alligator|fox|snake|shark|turtle|dog|cat|bird|animale|cervo|cavallo|scimmia|volpe|serpente|requin|cheval|chien|chat|tortue|caballo|perro|gato|tiburón|tartaruga|cavalo|cachorro|gato|hiu|kura-kura|hewan)\b/iu
  }
];

const NEGATIVE_RULES: SignalRule[] = [
  {
    label: "serious-health",
    points: -28,
    pattern: /\b(cancer|tumou?r|disease|disorder|ocd|trauma|infection|infected|medical|health|menstruat|periods|cancro|tumore|malattia|disturbo|salute|mestru|cancer|maladie|trouble|santé|menstru|cáncer|enfermedad|trastorno|salud|menstru|câncer|doença|transtorno|saúde|menstrua|kanker|penyakit|gangguan|kesehatan|menstruasi)\b/iu
  },
  {
    label: "crime-or-court",
    points: -30,
    pattern: /\b(murder|kidnap|prison|jail|fraud|prosecutor|indict|arrested|molotov|court case|carcere|sequestro|truffa|procura|arrestat|omicid|tribunale|enlèvement|prison|fraude|procureur|arrêté|secuestro|prisión|fraude|fiscalía|arrestad|prisão|fraude|promotor|preso|penculikan|penjara|penipuan|jaksa|ditangkap)\b/iu
  },
  {
    label: "policy-politics",
    points: -24,
    pattern: /\b(regulation\w*|policy|government\w*|parliament\w*|election\w*|referendum\w*|minister\w*|politic\w*|regolament\w*|governo|parlamento|elezion\w*|referendum\w*|ministr\w*|réglement\w*|gouvernement\w*|parlement\w*|élection\w*|référendum\w*|ministr\w*|regulación\w*|gobierno|parlamento|elecci\w*|referéndum\w*|ministr\w*|regulação\w*|governo|parlamento|eleiç\w*|referendo\w*|ministr\w*|regulasi|pemerintah|parlemen|pemilu|referendum|menteri)\b/iu
  },
  {
    label: "generic-explainer",
    points: -10,
    pattern: /^(what|how|why|are |can |could |should |cosa |come |perché|perche|che cosa|pourquoi|comment|qu['’]est|qué |que |cómo|como |por qué|por que|o que|como |por que|apa |bagaimana|mengapa)\b/iu
  }
];

const SOURCE_BONUS: Array<[RegExp, number, string]> = [
  [/^UPI Odd News$/i, 28, "quirky-source"],
  [/^ScienceDaily Strange & Offbeat$/i, 24, "quirky-source"],
  [/^Rai Televideo Culture$/i, 6, "culture-source"],
  [/^Phys\.org Plants & Animals$/i, 5, "animal-source"],
  [/^Phys\.org Archaeology$/i, 4, "archaeology-source"]
];

function material(candidate: ArticleCandidate): string {
  return `${candidate.title} ${candidate.summary ?? ""}`;
}

export function preScoutPlayability(candidate: ArticleCandidate): PreScoutPlayability {
  const positiveText = candidate.title;
  const negativeText = material(candidate);
  const positiveSignals: string[] = [];
  const negativeSignals: string[] = [];
  let score = 0;

  for (const [rule, bonus, label] of SOURCE_BONUS) {
    if (rule.test(candidate.discoverySource ?? candidate.sourceName)) {
      score += bonus;
      positiveSignals.push(label);
    }
  }

  for (const rule of POSITIVE_RULES) {
    if (!rule.pattern.test(positiveText)) continue;
    score += rule.points;
    positiveSignals.push(rule.label);
  }

  if (candidate.categoryHint === "records") {
    score += 10;
    positiveSignals.push("records-hint");
  } else if (candidate.categoryHint === "animals") {
    score += 5;
    positiveSignals.push("animals-hint");
  }

  for (const rule of NEGATIVE_RULES) {
    if (!rule.pattern.test(negativeText)) continue;
    score += rule.points;
    negativeSignals.push(rule.label);
  }

  // Geography is useful downstream, but location alone must never make a story playable.
  return {
    score: Math.max(-100, Math.min(100, score)),
    positiveSignals: [...new Set(positiveSignals)],
    negativeSignals: [...new Set(negativeSignals)]
  };
}

export function comparePreScoutPriority(a: ArticleCandidate, b: ArticleCandidate): number {
  const aScore = preScoutPlayability(a).score;
  const bScore = preScoutPlayability(b).score;
  if (aScore !== bScore) return bScore - aScore;

  const at = a.publishedAt ? Date.parse(a.publishedAt) : 0;
  const bt = b.publishedAt ? Date.parse(b.publishedAt) : 0;
  return bt - at;
}
