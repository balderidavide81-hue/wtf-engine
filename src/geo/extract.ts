import type { ArticleCandidate } from "../domain/types.js";

export interface EventGeography {
  eventCountry?: string;
  eventLocation?: string;
}

interface LocationAlias {
  alias: string;
  country: string;
  label: string;
}

const DISPLAY_LOCALES = ["en", "it", "fr", "es", "pt-BR", "id", "de", "tr"] as const;

const COUNTRY_CODES = (
  "AD AE AF AG AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ " +
  "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK " +
  "FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ " +
  "IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG " +
  "MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH " +
  "PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY " +
  "SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW"
).split(" ");

// Country names that are also common personal names, places outside that country,
// or ordinary words are intentionally excluded from generic free-text matching.
const AMBIGUOUS_COUNTRY_NAMES = new Set([
  "chad", "congo", "georgia", "guinea", "jordan", "mali", "turkey"
]);

const LOCATION_HINTS: LocationAlias[] = [
  // United States — useful for the odd-news feeds, which frequently name a state
  // but not the country.
  ...[
    "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
    "Florida","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana",
    "Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri",
    "Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York",
    "North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
    "South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia",
    "Washington","West Virginia","Wisconsin","Wyoming","District of Columbia"
  ].map(label => ({ alias: label, country: "US", label })),

  // High-signal city/region aliases across the currently enabled local editions.
  { alias: "Taipei", country: "TW", label: "Taipei" },
  { alias: "Taiwan", country: "TW", label: "Taiwan" },
  { alias: "Rome", country: "IT", label: "Rome" },
  { alias: "Roma", country: "IT", label: "Roma" },
  { alias: "Milan", country: "IT", label: "Milan" },
  { alias: "Milano", country: "IT", label: "Milano" },
  { alias: "Naples", country: "IT", label: "Naples" },
  { alias: "Napoli", country: "IT", label: "Napoli" },
  { alias: "Paris", country: "FR", label: "Paris" },
  { alias: "Marseille", country: "FR", label: "Marseille" },
  { alias: "Lyon", country: "FR", label: "Lyon" },
  { alias: "Madrid", country: "ES", label: "Madrid" },
  { alias: "Barcelona", country: "ES", label: "Barcelona" },
  { alias: "Valencia", country: "ES", label: "Valencia" },
  { alias: "São Paulo", country: "BR", label: "São Paulo" },
  { alias: "Sao Paulo", country: "BR", label: "São Paulo" },
  { alias: "Rio de Janeiro", country: "BR", label: "Rio de Janeiro" },
  { alias: "Brasília", country: "BR", label: "Brasília" },
  { alias: "Brasilia", country: "BR", label: "Brasília" },
  { alias: "Jakarta", country: "ID", label: "Jakarta" },
  { alias: "Bali", country: "ID", label: "Bali" },
  { alias: "Sydney", country: "AU", label: "Sydney" },
  { alias: "Melbourne", country: "AU", label: "Melbourne" },
  { alias: "Brisbane", country: "AU", label: "Brisbane" },
  { alias: "Cape Town", country: "ZA", label: "Cape Town" },
  { alias: "Johannesburg", country: "ZA", label: "Johannesburg" },
  { alias: "Nairobi", country: "KE", label: "Nairobi" },
  { alias: "Lagos", country: "NG", label: "Lagos" },
  { alias: "Istanbul", country: "TR", label: "Istanbul" },
  { alias: "İstanbul", country: "TR", label: "İstanbul" },
  { alias: "Ankara", country: "TR", label: "Ankara" },
  { alias: "Izmir", country: "TR", label: "Izmir" },
  { alias: "İzmir", country: "TR", label: "İzmir" },
  { alias: "Bursa", country: "TR", label: "Bursa" },

  // Common English-language shorthand that Intl.DisplayNames does not provide.
  { alias: "United States", country: "US", label: "United States" },
  { alias: "United States of America", country: "US", label: "United States" },
  { alias: "USA", country: "US", label: "United States" },
  { alias: "U.S.A.", country: "US", label: "United States" },
  { alias: "United Kingdom", country: "GB", label: "United Kingdom" },
  { alias: "Britain", country: "GB", label: "United Kingdom" },
  { alias: "Great Britain", country: "GB", label: "United Kingdom" },
  { alias: "England", country: "GB", label: "England" },
  { alias: "Scotland", country: "GB", label: "Scotland" },
  { alias: "Wales", country: "GB", label: "Wales" },
  { alias: "Northern Ireland", country: "GB", label: "Northern Ireland" },
  { alias: "South Korea", country: "KR", label: "South Korea" },
  { alias: "North Korea", country: "KP", label: "North Korea" },
  { alias: "UAE", country: "AE", label: "United Arab Emirates" }
];

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase()
    .replace(/[’'\-.]/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface AliasMatch extends LocationAlias {
  start: number;
  end: number;
  specific: boolean;
}

function aliasMatches(material: string, entry: LocationAlias, specific: boolean): AliasMatch[] {
  const haystack = ` ${normalize(material)} `;
  const needle = ` ${normalize(entry.alias)} `;
  if (needle.trim().length < 3) return [];

  const matches: AliasMatch[] = [];
  let from = 0;
  while (from < haystack.length) {
    const start = haystack.indexOf(needle, from);
    if (start < 0) break;
    matches.push({ ...entry, start, end: start + needle.length, specific });
    from = start + Math.max(1, needle.length - 1);
  }
  return matches;
}

function overlaps(a: AliasMatch, b: AliasMatch): boolean {
  return a.start < b.end && a.end > b.start;
}

let generatedCountryAliases: LocationAlias[] | null = null;

function countryAliases(): LocationAlias[] {
  if (generatedCountryAliases) return generatedCountryAliases;

  const aliases = new Map<string, LocationAlias>();
  for (const locale of DISPLAY_LOCALES) {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    for (const country of COUNTRY_CODES) {
      const label = names.of(country);
      if (!label || label === country || /^unknown region$/i.test(label)) continue;
      const normalized = normalize(label);
      if (normalized.length < 4 || AMBIGUOUS_COUNTRY_NAMES.has(normalized)) continue;
      aliases.set(`${country}:${normalized}`, { alias: label, country, label });
    }
  }

  generatedCountryAliases = [...aliases.values()].sort(
    (a, b) => normalize(b.alias).length - normalize(a.alias).length
  );
  return generatedCountryAliases;
}

function detect(material: string): EventGeography {
  if (!material.trim()) return {};

  const rawMatches = [
    ...LOCATION_HINTS.flatMap(entry => aliasMatches(material, entry, true)),
    ...countryAliases().flatMap(entry => aliasMatches(material, entry, false))
  ].sort((a, b) => {
    const length = (b.end - b.start) - (a.end - a.start);
    if (length !== 0) return length;
    return Number(b.specific) - Number(a.specific);
  });

  // Prefer the longest phrase when aliases overlap. This keeps "New Mexico"
  // from also matching "Mexico", and "New Jersey" from also matching "Jersey".
  const matches: AliasMatch[] = [];
  for (const match of rawMatches) {
    if (matches.some(kept => overlaps(match, kept))) continue;
    matches.push(match);
  }

  const countries = [...new Set(matches.map(match => match.country))];
  if (countries.length !== 1) return {};

  const country = countries[0];
  const best = matches
    .filter(match => match.country === country)
    .sort((a, b) => {
      if (a.specific !== b.specific) return Number(b.specific) - Number(a.specific);
      return normalize(b.alias).length - normalize(a.alias).length;
    })[0];

  return {
    eventCountry: country,
    eventLocation: best?.label
  };
}

export function extractEventGeography(input: {
  title: string;
  summary?: string;
  locationHint?: string;
}): EventGeography {
  // Structured feed geography wins when present.
  if (input.locationHint?.trim()) {
    const structured = detect(input.locationHint);
    if (structured.eventCountry) {
      return {
        eventCountry: structured.eventCountry,
        eventLocation: input.locationHint.trim().slice(0, 240)
      };
    }
  }

  return detect(`${input.title} ${input.summary ?? ""}`);
}

export function sourceGeography(candidate: ArticleCandidate): string {
  return candidate.sourceCountry?.trim().toUpperCase()
    || candidate.country?.trim().toUpperCase()
    || "UNKNOWN";
}
