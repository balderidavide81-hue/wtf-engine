# Content Gate metrics — v0.6.24

Status: ACTIVE in production. Migration 003 was validated on an isolated Neon branch and applied to WTF Engine `main` on 2026-09-25.

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

No historical events are invented. The 2026-09-23 first-edition audit remains the documented baseline.
Editorial event telemetry is complete only for editions dated 2026-09-25 or later. Earlier editions may
still expose reliable generation-run/cost data, but edit/review/reject counts are intentionally treated
as incomplete rather than zero.

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

## Production activation

Completed on 2026-09-25:

1. migration 003 prepared on isolated Neon branch `br-muddy-breeze-b1ysc4l5`;
2. table, constraints, composite edition/card FK and indexes verified;
3. valid `card_reviewed` insert accepted on the temporary branch;
4. invalid scoped insert rejected;
5. migration applied to WTF Engine production branch `br-withered-rain-b1ue18f6`;
6. temporary branch deleted;
7. production schema verified with zero fabricated historical events;
8. telemetry code merged to `main` as commit `814f281`;
9. Vercel production deployment reached READY;
10. unauthenticated metrics endpoint smoke returned 401 with `Cache-Control: no-store`.

The first real write-path telemetry evidence should come from an edition dated 2026-09-25 or later.


## Alignment with the live structural gate

Telemetry is additive to the deterministic single-edition audit and seven-day structural Content Gate.
The structural PASS criteria do not change. The gate reports telemetry coverage separately and aggregates
clean-kept/edit/reject/cost only for days whose editorial telemetry is complete.

This prevents pre-activation editions from being misreported as "clean" merely because their historical
editorial actions were never recorded.
