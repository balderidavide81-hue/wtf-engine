# Second global Luna Scout evaluation — v0.6.14

Date: 2026-09-22

## Purpose

Validate the current worldwide discovery stack after:

- multilingual focused-source expansion;
- German ingestion and pre-Scout parity;
- RSS 1.0/RDF support and AllAfrica Wildlife;
- cross-publisher semantic dedupe;
- multilingual sensitivity hardening;
- title-first/conservative event geography.

This run executes Scout only. No Editor and no content/card persistence.

## Batch

Collection:

- sources: 23
- fetched: 918
- kept after deterministic filtering: 876
- source errors: 0
- Scout candidates: 30

Language mix:

- English: 24
- French: 1
- Italian: 1
- Spanish: 1
- German: 1
- Brazilian Portuguese: 1
- Indonesian: 1

Source-geography mix:

- US: 6
- GLOBAL: 17
- France: 1
- Italy: 1
- Spain: 1
- Germany: 1
- Brazil: 1
- Indonesia: 1
- Africa: 1

Conservative event geography:

- US: 6
- Zambia: 1
- Norway: 1
- Namibia: 1
- Bolivia: 1
- Ethiopia: 1
- Argentina: 1
- unresolved/UNKNOWN: 18

## Luna Scout result

Decision totals:

- KEEP: 16
- MAYBE: 8
- REJECT: 6

All 16 KEEP results were evidenceStatus=SUPPORTED.

Previous real global Scout baseline:

- KEEP: 13
- MAYBE: 11
- REJECT: 6

Change versus baseline:

- KEEP: +3
- MAYBE: -3
- REJECT: unchanged

The second batch therefore converted three borderline items into KEEP without increasing the rejection count.

## Pre-Scout calibration

Average deterministic playability score by Luna decision:

- KEEP: 34.00
- MAYBE: 19.63
- REJECT: 12.67

This is a useful separation: deterministic ranking is not replacing Luna, but it is materially concentrating the paid window toward stories Luna later accepts.

## Language outcome

- English: 14 KEEP / 6 MAYBE / 4 REJECT
- French: 1 KEEP
- Italian: 1 MAYBE
- Spanish: 1 REJECT
- German: 1 MAYBE
- Brazilian Portuguese: 1 KEEP
- Indonesian: 1 REJECT

The non-English exploration slots are still mixed in quality, but they are now producing real KEEP results without forced quotas.

## Source outcome

Strong current contributors:

- UPI Odd News: 6 KEEP / 6 submitted
- ScienceDaily Strange & Offbeat: 3 KEEP / 3 MAYBE
- Smithsonian Smart News: 3 KEEP / 1 REJECT
- Phys.org Plants & Animals: 2 KEEP / 1 REJECT
- Motor1 France Insolite: 1 KEEP
- InsideEVs Brasil Curiosidades: 1 KEEP

Useful but borderline:

- Phys.org Space: 1 MAYBE
- Phys.org Archaeology: 1 MAYBE
- InsideEVs Italia Curiosita: 1 MAYBE
- Motor1 Germany Bizarr: 1 MAYBE
- AllAfrica Wildlife: 1 MAYBE

Weak in this batch:

- New Atlas Science: 2 REJECT
- Motor1 Espana Curiosidades: 1 REJECT
- The Conversation Indonesia: 1 REJECT

These are observations from one live batch, not permanent source bans.

## Example high-confidence KEEP stories

- White emu wandering loose on a Florida highway
- Horse escaping a New Mexico parade
- Nearly 430-foot Slim Jim world record
- New snake species named after Guns N' Roses guitarist Slash
- Chemical "ID card" in cat urine
- Youngest known planet
- Three wild dogs' record-breaking journey across Zambia
- 43-year-old Renault 5 with only 12 km
- Mastodon tooth found in a California creek
- Norway reaching 98.7% electric-car registrations
- First newly recognized wildcat species in a century
- New egg-eating snake species in Ethiopia

## Geography conclusion

v0.6.14 intentionally favors precision over recall. The current selected batch resolved 12/30 event countries, and the resolved values were coherent. The prior false China assignment on a broad West-Africa headline no longer appears.

## Usage

Scout model: `gpt-5.6-luna`

Engine-reported usage:

- input tokens: 5,798
- cached input tokens: 0
- output tokens: 2,887
- total tokens: 8,685
- estimated batch cost: $0.004624

This is the engine's configured pricing estimate for the run; it is not a billing statement.

## Editor follow-up

The first real 16-card Editor evaluation is complete and documented in
`docs/FIRST_EDITOR_EVAL_V0615.md`.

It exposed and fixed one-to-one card cardinality, and then drove v0.6.16 gameplay-quality hardening
for hook leakage, answer-position bias, TRUE_FALSE quality, PREDICT exclusivity, idiomatic localization
and reveal grounding.

The v0.6.16 source is merged but its live comparison run is currently blocked by the Vercel deployment
rate limit. Do not expand source volume again before the post-hardening card-quality comparison.
