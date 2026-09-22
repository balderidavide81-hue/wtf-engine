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

const DISPLAY_LOCALES = ["en", "it", "fr", "es", "pt-BR", "id"] as const;

// Country names that are also common personal names, places outside that country,
// or ordinary words are intentionally excluded from generic free-text matching.
const AMBIGUOUS_COUNTRY_NAMES = new Set([
  "chad", "georgia", "guinea", "jordan", "mali", "turkey"
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

function matchesAlias(material: string, alias: string): boolean {
  const haystack = ` ${normalize(material)} `;
  const needle = ` ${normalize(alias)} `;
  return needle.trim().length >= 3 && haystack.includes(needle);
}

let generatedCountryAliases: LocationAlias[] | null = null;

function countryAliases(): LocationAlias[] {
  if (generatedCountryAliases) return generatedCountryAliases;

  const aliases = new Map<string, LocationAlias>();
  for (const locale of DISPLAY_LOCALES) {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    for (let first = 65; first <= 90; first += 1) {
      for (let second = 65; second <= 90; second += 1) {
        const country = String.fromCharCode(first, second);
        const label = names.of(country);
        if (!label || label === country || /^unknown region$/i.test(label)) continue;
        const normalized = normalize(label);
        if (normalized.length < 4 || AMBIGUOUS_COUNTRY_NAMES.has(normalized)) continue;
        aliases.set(`${country}:${normalized}`, { alias: label, country, label });
      }
    }
  }

  generatedCountryAliases = [...aliases.values()].sort(
    (a, b) => normalize(b.alias).length - normalize(a.alias).length
  );
  return generatedCountryAliases;
}

function detect(material: string): EventGeography {
  if (!material.trim()) return {};

  const matches = [...LOCATION_HINTS, ...countryAliases()]
    .filter(entry => matchesAlias(material, entry.alias));

  const countries = [...new Set(matches.map(match => match.country))];
  if (countries.length !== 1) return {};

  const country = countries[0];
  const best = matches
    .filter(match => match.country === country)
    .sort((a, b) => normalize(b.alias).length - normalize(a.alias).length)[0];

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
