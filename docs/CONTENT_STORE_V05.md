# WTF Engine v0.5 — Content Store / Daily Edition

Status: source-only foundation. The SQL migration is prepared but must not be applied automatically.

## Goal

Separate expensive content generation from gameplay reads. Scout/Editor run once, their provenance and cost are persisted, and clients later read already-produced cards.

## Persistence contract

- `sources`: stable source registry.
- `articles`: idempotent source material keyed by external identity/canonical URL.
- `pipeline_runs`: run diagnostics, prompt/model versions and estimated AI cost.
- `scout_results`: immutable Scout decisions tied to article + run.
- `game_cards`: Editor output plus lifecycle/resolution state.
- `daily_editions`: calendar edition with explicit `draft → reviewed → published` workflow.
- `daily_edition_cards`: ordered edition membership.

PREDICT cards can later move through `open → resolved|void`; `resolution_rule` is retained from generation and `resolution` stores the eventual evidence/result.

## Idempotency

Ingestion must upsert an already-seen article rather than paying Scout/Editor again solely because the feed returned it again. The application persistence adapter will enforce this before AI work in the next implementation step.

## Deployment discipline

Do not apply this migration or deploy intermediate v0.5 work. Build the adapter and pipeline integration on the feature branch, then review the complete coherent block before one migration/deployment.
