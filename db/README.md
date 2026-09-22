# Database

v0.5 introduces the persistent content store.

Prepared migration:

`db/migrations/001_content_store_v05.sql`

It creates:

- sources
- articles
- generation_leases
- pipeline_runs
- scout_results
- game_cards
- daily_editions
- daily_edition_cards

The migration also defines article identity constraints, AI prompt-version idempotency indexes, card lifecycle constraints and PREDICT answer/resolution invariants.

The migration is additive and is intentionally **not** applied by source-only repository work. Use `docs/V05_LIVE_ROLLOUT_CHECKLIST.md` for the controlled production step.
