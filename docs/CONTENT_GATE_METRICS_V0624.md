# Content Gate metrics — v0.6.24

Status: source-only. Migration 003 is NOT applied to production.

## Why this block exists

The first production edition proved the end-to-end path. The next question is not whether the backend
works, but whether it produces enough playable material with little editorial repair across multiple
days.

v0.6.24 records the editorial work itself so the Content Gate can be measured instead of reconstructed
from memory.

## New persistence

`db/migrations/003_editorial_events_v0624.sql` adds `editorial_events`.

Recorded events:

- `card_edited`
- `card_reviewed`
- `card_rejected`
- `edition_reviewed`
- `edition_published`

Events are written in the same database transaction as the editorial state change. Retry-safe edition
transitions do not create a second event when the edition is already in the requested state.

No historical events are invented. The 2026-09-23 first-edition audit remains the documented baseline;
telemetry starts when migration 003 is actually applied.

## Metrics contract

Authenticated `GET /api/editorial-metrics?date=YYYY-MM-DD` returns:

- total, kept, rejected and decided cards;
- lifecycle distribution;
- WTF / STORY / PREDICT mix;
- MULTIPLE_CHOICE / TRUE_FALSE / PREDICT mix;
- number of distinct cards edited;
- number of edit/review/reject actions;
- generation run count and summed generation cost for runs represented in the edition;
- first/last recorded editorial event timestamps.

The editorial console reads this endpoint and shows the main Gate numbers next to the selected edition.

## Gate interpretation

A practical daily record is:

- generated cards;
- rejected cards;
- distinct cards requiring an edit;
- edit actions;
- final kept cards;
- estimated generation cost.

The important trend is the share of cards that can be published without repair, not raw generation
volume. A day with many generated cards but many rejects/edits is weaker than a smaller clean edition.

## Deployment order

Because store mutations begin writing `editorial_events`, the code must not reach production before the
table exists.

Required order:

1. validate migration 003 on PostgreSQL 18 / isolated Neon branch;
2. apply migration 003 to WTF Engine production Neon;
3. run source typecheck on the exact branch snapshot;
4. merge v0.6.24 to `main`;
5. confirm Vercel deployment READY;
6. perform a read-only metrics smoke against an existing edition;
7. use the next draft edition for the first write-path telemetry smoke.

Until the Neon connector can address project `autumn-violet-57425012` reliably, stop after the
source-only PR. Do not merge the instrumentation branch.


## Alignment with the live structural gate

This branch was refreshed on top of current main after v0.6.28. It preserves the live deterministic audit,
seven-day structural Content Gate, manual Daily Edition generation controls and manual PREDICT source
health probe. Telemetry remains additive: after migration 003 is safely applied, the console will show
a separate Content telemetry panel for edit/reject effort and generation cost without replacing the
existing operational controls.

The branch must remain draft/unmerged until migration 003 has been validated and applied to production
Neon.
