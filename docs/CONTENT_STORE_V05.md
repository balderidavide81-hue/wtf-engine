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

Ingestion must upsert an already-seen article rather than paying Scout/Editor again solely because the feed returned it again. The persistence adapter enforces this before AI work by matching both external identity and canonical URL.

## Deployment discipline

Do not apply this migration or deploy intermediate v0.5 work. Build the adapter and pipeline integration on the feature branch, then review the complete coherent block before one migration/deployment.

## Pipeline integration

When `DATABASE_URL` is configured, `/api/daily` now uses the Neon store. Before Scout, the pipeline asks for external IDs that already have a persisted Scout result and removes them from the paid AI batch. New Scout/Editor output is then persisted and attached to the day's draft edition.

`/api/daily` now fails closed when `DATABASE_URL` is absent. Production generation therefore cannot intentionally incur Scout/Editor cost and then discard the output because persistence was misconfigured.

The API report exposes `previouslyProcessed` and, when persistence is active, run/edition/card IDs for auditability.

## Repeated-run safety

A second generation run on the same configured edition day is incremental. Existing edition cards are preserved and only newly persisted card IDs are appended. Repeating the same card ID is a no-op.

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

This endpoint is an internal workflow surface protected by `EDITORIAL_API_TOKEN`.

## Security boundary and gameplay API

`/api/editorial` now requires `Authorization: Bearer <EDITORIAL_API_TOKEN>`. Missing server configuration fails closed: no token means no editorial access.

`GET /api/gameplay-daily?date=YYYY-MM-DD` is intentionally read-only and public. It returns only a published edition and never exposes drafts, rejected cards, Scout diagnostics, AI costs, internal IDs for runs, or editorial actions.

The public edition feed suppresses answer/reveal data for active cards. Resolved PREDICT cards expose their resolved option and reveal; voided PREDICT cards remain visible with a void reason so a future client can settle/refund them. PREDICT resolution rules are public before adjudication for transparency. WTF/STORY answer reveal should be delivered later through a gameplay answer flow rather than embedded in the initial edition payload.

The gameplay response is cacheable at the edge for 60 seconds with stale-while-revalidate, keeping normal player reads independent from AI generation.

## PREDICT resolution lifecycle

Published PREDICT cards enter `open`. Resolution is an authenticated editorial action and is accepted only once while the card is open.

- `resolve_prediction`: requires `cardId`, a valid `outcomeOptionIndex`, `evidenceUrl`, and non-empty `evidenceNote`. The selected outcome and evidence are stored atomically and the card becomes `resolved`.
- `void_prediction`: requires `cardId` and a reason; an evidence URL is optional. The card becomes `void`.

A resolved/void prediction cannot be resolved again through these operations. Outcome indexes are checked against the stored options array. This keeps the result immutable after adjudication and prevents malformed outcome values.

## v0.5 source audit hardening

The paid generation endpoint `/api/daily` is no longer public: it requires `Authorization: Bearer <GENERATION_API_TOKEN>` and fails closed when the secret is absent. This is separate from `EDITORIAL_API_TOKEN`, so gameplay clients cannot trigger Luna spend or obtain generation diagnostics.

Scout and Editor persistence now has database uniqueness per `(article_id, prompt_version)`, with conflict-safe writes. The inline Editor prompt is recorded explicitly as `editor/inline-v0.3` rather than implying a nonexistent external prompt file.

The public content surface remains the read-only published gameplay endpoint. Internal collection, Scout, generation and editorial routes all require server-side bearer authorization. Migration/deploy remain deliberately unapplied during source audit.

## Final pre-migration audit notes

Daily edition dates now use the explicit IANA timezone `EDITION_TIME_ZONE` (default `Europe/Rome`) across generation, editorial defaults and gameplay defaults instead of UTC date slicing.

Article persistence reconciles identity using either stable external ID or canonical URL before insert, avoiding the previous failure mode where a feed changed its external ID while keeping the same canonical story URL.

`/api/daily` now acquires an expiring database-backed `daily-generation` lease before collection/AI work. A second overlapping request receives `409 generation_already_running`. The lease is released in `finally` and also has a database expiry so a crashed serverless invocation cannot block generation indefinitely.


## Editorial freeze and retry semantics

Once an edition leaves `draft`, individual review/reject mutations are frozen. This prevents a reviewed edition from changing underneath a later publish call.

Edition transitions are retry-safe for the same target state: repeating `reviewed → reviewed` or `published → published` returns the current edition instead of creating a second transition.

Persisted Scout and Editor outputs are immutable for a given `(article_id, prompt_version)`. A concurrent/retried write returns the existing row instead of overwriting an already reviewed or published card.


## General repository audit hardening

A higher-depth repository audit after the initial v0.5 implementation added the following safeguards:

- `/api/scout` and `/api/collect` are authenticated internal diagnostics rather than public operational surfaces.
- `/api/daily` is POST-only because it has side effects and incurs model cost.
- RSS fetches have a timeout and reject non-HTTP(S) article links.
- RSS candidate IDs no longer depend on feed position.
- URL canonicalization sorts query parameters and strips known tracking parameters consistently.
- Scout rejects unknown or duplicate returned article IDs.
- Editor validates option count, answer indexes and PREDICT/WTF invariants.
- AI batch caps are defined once in the AI modules and reused by APIs/pipeline.
- card invariants are duplicated at the database layer so direct writes cannot bypass core constraints.
- local secrets/build artifacts are excluded through `.gitignore`.


## Generation single-flight

The migration includes `generation_leases`. Production generation acquires a 10-minute lease before any paid AI work. This closes the previously documented race where two serverless instances could both pass the processed-story check and pay Scout/Editor simultaneously.
