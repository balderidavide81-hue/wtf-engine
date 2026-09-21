# WTF Engine v0.5 — Source Audit 2026-09-21

Status: source-only audit complete. No migration, deployment, production environment change or AI call performed.

## Result

The v0.5 content-store block is coherent enough to prepare a controlled live rollout, subject to the rollout checklist and the known single-flight generation constraint below.

## Verified boundaries

- Paid generation is protected by `GENERATION_API_TOKEN` and marked `no-store`.
- Editorial read/write operations are protected by `EDITORIAL_API_TOKEN` and marked `no-store`.
- Public gameplay is read-only and reads only published editions.
- Active-card reveal data is not embedded in the public edition payload.
- PREDICT resolution/void actions are authenticated and evidence-backed.
- Edition dates use one explicit IANA timezone.
- Invalid public/editorial edition dates return a client error rather than falling into database errors.

## Persistence / idempotency

- RSS article IDs are now stable across feed reorder and are based on canonical article URLs rather than feed index.
- URL canonicalization is shared by ingestion and dedupe.
- Already-processed stories are detected by external identity or canonical URL before paid AI work.
- Scout and Editor rows are unique per `(article_id, prompt_version)`.
- Conflict paths preserve the first persisted AI output instead of silently overwriting an already-reviewed/published result.
- Empty collection reruns do not create useless persistence runs.
- A run with new Scout material but zero Editor cards records the run without mutating an edition.

## AI output integrity

- Unknown Scout article IDs fail the run instead of being silently accepted.
- Missing Scout outputs are explicitly reported.
- Unknown Editor article IDs fail the run.
- Duplicate Editor cards for one article fail the run.
- Editor cards require at least two options.
- Any non-null answer index must be within the option array.
- WTF cards require a correct answer.
- PREDICT cards must start unresolved and require a non-empty resolution rule.
- Prompt-version provenance comes from the AI modules that own the prompts.

## Editorial integrity

- Individual card review/reject changes are allowed only while all associated editions remain `draft`.
- Once an edition becomes `reviewed`, its card review state is frozen.
- Same-state edition transitions are retry-safe.
- Publishing promotes reviewed PREDICT cards to `open` and other reviewed cards to `published`.
- Resolved/void PREDICT outcomes cannot be adjudicated a second time through the normal transition API.

## Migration alignment

Prepared migration:
`db/migrations/001_content_store_v05.sql`

Expected unique AI indexes:
- `scout_results_article_prompt_uq`
- `game_cards_article_prompt_uq`

No package lock exists in the repository; dependency resolution is currently package.json-based.

## Generation concurrency

The earlier simultaneous-run cost risk was closed during the deeper audit. `/api/daily` now acquires an expiring database-backed lease before paid work and returns `409 generation_already_running` to overlapping requests.

## Deliberately not completed in this block

- No Neon migration applied.
- No production secrets changed.
- No Vercel deployment.
- No Luna/API validation call.
- No public WTF answer/reveal submission endpoint yet.
- No per-user wallet, stake or scoring persistence yet.
- No automatic PREDICT resolver yet.

Use `docs/V05_LIVE_ROLLOUT_CHECKLIST.md` for the first controlled live activation.


## Higher-depth repository audit pass

A second, repository-wide audit was performed before any live migration/deploy because the earlier implementation had been produced with insufficient reasoning depth.

Additional defects found and corrected:

- public legacy `/api/scout` could trigger paid OpenAI work without authentication;
- public `/api/collect` exposed internal feed diagnostics;
- paid `/api/daily` used GET semantics despite side effects;
- `/api/daily` could spend AI with no database configured and discard persistence;
- RSS IDs depended on feed array position;
- feed/article URL validation was too permissive;
- RSS requests lacked timeout/body/item bounds;
- Scout duplicate/unknown output IDs were not enforced at the AI boundary;
- Editor semantic validation did not reject duplicate/empty/invalid card shapes strongly enough;
- card review actions were not scoped to the requested edition;
- reviewed editions did not originally freeze every card-review path;
- PREDICT draft reveal text could later be mistaken for the real outcome;
- voided PREDICT cards would disappear from the public edition;
- public PREDICT results lacked adjudication evidence metadata;
- article external-ID/canonical-URL collisions could be resolved ambiguously;
- post-commit edition reads could fall into rollback error handling;
- database checks did not fully encode application-level card/PREDICT invariants;
- repository had no `.gitignore` protection for local secrets/build artifacts;
- current README/architecture/API/database docs materially lagged the implementation.

These were fixed source-side. Production remains untouched.

### Remaining pre-live validation

A real TypeScript typecheck/build has not been executed by this source-only connector workflow. The live checklist now treats `npm run typecheck` as a hard precondition before migration/deployment.

Independent automated source verification is also not implemented yet. Human editorial source review remains the publication gate; the repository documentation now states this explicitly.

Additional deep-audit hardening also added prompt-injection instructions for untrusted feed/model text, bounded RSS response/item/text volume, hashed source keys, evidence-URL validation, and version-bumped prompt provenance (`scout/v0.2`, `editor/inline-v0.3`).


## Executed validation gate

A one-shot GitHub Actions validation was executed on commit `138d465401865efbd2cceeea0064597328d6d670` (run `35605054548`) and completed successfully.

The gate performed:
- dependency installation on Node 22;
- `npm run typecheck`;
- PostgreSQL 18 startup;
- first application of `db/migrations/001_content_store_v05.sql`;
- second application of the same migration to verify idempotent re-application;
- schema table-count verification;
- valid PREDICT insert;
- rejection of invalid plain-published PREDICT;
- rejection of WTF card without a correct answer;
- generation-lease SQL smoke test.

The temporary CI workflow was removed immediately after the successful run to avoid consuming GitHub Actions quota on later feature-branch commits.


## Neon production migration

The v0.5 migration was prepared and validated on temporary Neon branch `br-jolly-lab-b1803g1k`, then explicitly approved and applied to project `autumn-violet-57425012` / branch `main` (`br-withered-rain-b1ue18f6`) on 2026-09-21.

Post-apply verification on the production branch confirmed:
- all 8 expected v0.5 tables;
- both prompt-provenance unique indexes;
- generation lease table and constraints.

The temporary migration branch was deleted automatically after promotion.


## Final post-hardening validation

After the last application-code hardening pass, a second one-shot validation ran on commit `cf2ecf8330a6a889f62a0e31f6d047b0f0bd0e1f` (GitHub Actions run `35607388399`) and completed successfully.

This final gate re-ran:
- Node 22 dependency installation;
- `npm run typecheck`;
- PostgreSQL 18 migration application;
- idempotent migration re-application.

The temporary workflow was removed immediately after success to avoid ongoing GitHub Actions consumption.
