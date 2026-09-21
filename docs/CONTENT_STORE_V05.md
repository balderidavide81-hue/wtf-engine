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

## Pipeline integration

When `DATABASE_URL` is configured, `/api/daily` now uses the Neon store. Before Scout, the pipeline asks for external IDs that already have a persisted Scout result and removes them from the paid AI batch. New Scout/Editor output is then persisted and attached to the day's draft edition.

Without `DATABASE_URL`, the endpoint preserves the existing non-persistent behavior. This allows source work to remain deploy-safe until the migration and environment are deliberately enabled.

The API report exposes `previouslyProcessed` and, when persistence is active, run/edition/card IDs for auditability.

## Repeated-run safety

A second generation run on the same UTC day is incremental. Existing edition cards are preserved and only newly persisted card IDs are appended. Repeating the same card ID is a no-op.

Once an edition is `reviewed` or `published`, generation is not allowed to mutate its membership. This prevents a later scheduler/manual run from silently changing an edition that has already entered editorial workflow.

Persistence diagnostics distinguish `newCardIds` from the complete `editionCardIds`.

## Editorial workflow

`GET /api/editorial?date=YYYY-MM-DD` returns the draft/reviewed/published edition with full card and source context.

`POST /api/editorial?date=YYYY-MM-DD` accepts:
- `review_card` + `cardId`
- `reject_card` + `cardId`
- `review_edition`
- `publish_edition`

An edition can move only `draft → reviewed → published`. Every non-rejected card must be individually reviewed before the edition enters review. Publishing promotes reviewed WTF/STORY cards to `published` and PREDICT cards to `open`. Published editions/cards cannot be silently edited by later generation or review calls.

This endpoint is an internal workflow surface and must be protected by authentication before any public production exposure.

## Security boundary and gameplay API

`/api/editorial` now requires `Authorization: Bearer <EDITORIAL_API_TOKEN>`. Missing server configuration fails closed: no token means no editorial access.

`GET /api/gameplay-daily?date=YYYY-MM-DD` is intentionally read-only and public. It returns only a published edition and never exposes drafts, rejected cards, Scout diagnostics, AI costs, internal IDs for runs, or editorial actions.

For an open PREDICT card, the public payload suppresses `reveal` until the card is resolved. This prevents the gameplay API from leaking the future answer/resolution content while betting is open. Published WTF/STORY cards and resolved predictions may expose their reveal.

The gameplay response is cacheable at the edge for 60 seconds with stale-while-revalidate, keeping normal player reads independent from AI generation.

## PREDICT resolution lifecycle

Published PREDICT cards enter `open`. Resolution is an authenticated editorial action and is accepted only once while the card is open.

- `resolve_prediction`: requires `cardId`, a valid `outcomeOptionIndex`, `evidenceUrl`, and non-empty `evidenceNote`. The selected outcome and evidence are stored atomically and the card becomes `resolved`.
- `void_prediction`: requires `cardId` and a reason; an evidence URL is optional. The card becomes `void`.

A resolved/void prediction cannot be resolved again through these operations. Outcome indexes are checked against the stored options array. This keeps the result immutable after adjudication and prevents malformed outcome values.
