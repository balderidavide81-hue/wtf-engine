# WTF Engine v0.5 — Controlled Live Rollout Checklist

Status: preparation only. Do not apply migration or deploy from this document automatically.

## Goal

Move the v0.5 content store live with one controlled database migration and one coherent production deployment, while keeping AI spend and Vercel deployment count low.

## Before touching production

1. Freeze source changes for the rollout window.
2. Confirm the feature branch contains the complete v0.5 block.
3. Final compiled/schema validation gate: PASS on commit `cf2ecf8330a6a889f62a0e31f6d047b0f0bd0e1f` (run `35607388399`; Node 22 + PostgreSQL 18). Re-run only if application/schema code changes after that snapshot.
4. Neon migration: APPLIED and post-verified on project `autumn-violet-57425012` / branch `main` on 2026-09-21.
5. Confirm production has or will receive these server-only variables:
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
   - `OPENAI_SCOUT_MODEL`
   - `OPENAI_EDITOR_MODEL`
   - `GENERATION_API_TOKEN`
   - `EDITORIAL_API_TOKEN`
   - `EDITION_TIME_ZONE=Europe/Rome`
6. Do not place either bearer token in the Flutter/mobile client.

## Database step

Apply `db/migrations/001_content_store_v05.sql` once.

Immediately verify, without writing content, that these objects exist:
- tables: `sources`, `articles`, `generation_leases`, `pipeline_runs`, `scout_results`, `game_cards`, `daily_editions`, `daily_edition_cards`
- unique article identities: `external_id`, `canonical_url`
- unique AI provenance indexes:
  - `scout_results_article_prompt_uq`
  - `game_cards_article_prompt_uq`
- lifecycle constraints include draft/reviewed/published/open/resolved/void/rejected as applicable.

If schema verification fails, stop before deployment.

## Deployment step

Deploy only the coherent v0.5 source after the migration and environment variables are ready. Avoid preview/development deployment churn.

## Production smoke sequence

Use exactly one controlled generation run.

1. POST to `/api/daily` without `GENERATION_API_TOKEN`.
   Expected: `401 unauthorized`; no AI call.
2. Call `/api/scout` and `/api/collect` without `GENERATION_API_TOKEN`.
   Expected: `401 unauthorized`; no AI call and no feed diagnostics.
3. Call `/api/editorial` without `EDITORIAL_API_TOKEN`.
   Expected: `401 unauthorized`.
4. Call `/api/gameplay-daily` before any edition is published.
   Expected: `404 published_edition_not_found`.
5. POST to `/api/daily` once with the generation bearer token.
   Inspect collection, Scout, Editor, cost diagnostics and persistence IDs.
6. Fetch the draft through authenticated `/api/editorial`.
7. Review/reject cards.
8. Move the edition to `reviewed`.
9. Publish it.
10. Fetch `/api/gameplay-daily`.
   Expected: only published/open/resolved/void public lifecycle states; no draft/rejected content; active-card reveal hidden.
11. If a PREDICT card exists, verify it is `open`; do not resolve it merely for smoke testing unless there is real-world evidence.

## Cost / concurrency guard

`/api/daily` enforces single-flight with the database-backed generation lease. As a smoke check, a deliberately overlapping second authenticated request should receive `409 generation_already_running` rather than start a second paid AI run. Do not perform that overlap test if conserving model cost is more important than testing the guard.

## Stop conditions

Stop the rollout before another generation call if any of these occur:
- migration/index mismatch
- unauthorized endpoint accepts a request
- draft/rejected card appears in public gameplay
- active-card reveal leaks
- duplicate article/card persistence
- unexplained AI cost spike
- edition date does not match the configured timezone

## Rollback posture

The database migration is additive. If the application deployment must be reverted, disable the new generation/editorial tokens or revert the application deployment while leaving the new tables unused. Do not drop production tables as an emergency rollback unless data has first been explicitly reviewed.


## Deep-audit additions

Before the first live run, verify that a published PREDICT exposes its resolution rule but not an outcome. After a real resolution, verify that the public result uses the evidence-backed adjudication note and evidence URL. A voided PREDICT must remain visible as `void` rather than disappearing from the edition.

Do not proceed to migration/deployment from an un-typechecked source snapshot.
