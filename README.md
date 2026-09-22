# WTF Engine

WTF Engine is an editorial backend that turns real-world curiosities into lightweight playable content.

## Current v0.5 pipeline

```
RSS sources
  -> deterministic filtering / canonical dedupe
  -> Luna Scout
  -> Luna Editor
  -> Neon content store
  -> authenticated editorial review
  -> published daily edition
  -> public read-only gameplay feed
```

The product goal remains deliberately narrow: prove that the engine can surface at least five genuinely playable stories per day for seven consecutive days before investing heavily in the consumer app.

## Safety and publication boundary

Scout's `SUPPORTED` label means the supplied feed material supports the classification. It is **not** an independent fact-check.

The current publication gate is human editorial review with the original source URL visible in `/api/editorial`. `src/verify/` is still only the contract for a future independent verification layer.

## API surfaces

- `GET /api/health` — public health check.
- `GET /api/collect` — internal source diagnostics; requires `GENERATION_API_TOKEN`.
- `POST /api/scout` — internal paid Scout diagnostics; requires `GENERATION_API_TOKEN`.
- `POST /api/daily?limit=30` — internal paid generation/persistence run; requires `GENERATION_API_TOKEN` and `DATABASE_URL`.
- `GET|POST /api/editorial?date=YYYY-MM-DD` — internal review/publish/adjudication surface; requires `EDITORIAL_API_TOKEN`.
- `GET /api/gameplay-daily?date=YYYY-MM-DD` — public read-only published edition.

Generation and editorial endpoints are server-side operational surfaces. Their bearer tokens must never be embedded in a mobile/web client.

## Repository layout

- `api/` — Vercel serverless endpoints.
- `src/ingest/` — RSS collection.
- `src/filters/` — deterministic filtering and deduplication.
- `src/ai/` — Scout and Editor.
- `src/pipeline/` — daily orchestration and diversity.
- `src/store/` — content-store contract and Neon adapter.
- `src/verify/` — future independent verification contract.
- `db/migrations/` — additive database migrations.
- `prompts/` — versioned prompt reference material.
- `evals/` — golden cases and failure regression library.
- `docs/` — architecture, audit, rollout and content-gate notes.

## Current rollout status

The v0.5 content-store work is staged on `feature/0.5-content-store`. The migration and production configuration are intentionally not applied by source-only audit work.

Before activation, use:

- `docs/V05_SOURCE_AUDIT_20260921.md`
- `docs/V05_LIVE_ROLLOUT_CHECKLIST.md`

The first live activation should be one controlled migration, one coherent production deployment and one single-flight generation run.
