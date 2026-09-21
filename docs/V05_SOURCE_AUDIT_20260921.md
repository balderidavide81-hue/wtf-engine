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

## Known residual risk

Two truly simultaneous authenticated `/api/daily` calls can both pass the pre-AI processed check before either persists, causing duplicate AI spend. Database constraints prevent duplicate stored Scout/Editor records, but they cannot refund duplicated upstream model calls.

For the current phase, keep generation single-flight. A database claim/lease can be added later if automated scheduling can overlap.

## Deliberately not completed in this block

- No Neon migration applied.
- No production secrets changed.
- No Vercel deployment.
- No Luna/API validation call.
- No public WTF answer/reveal submission endpoint yet.
- No per-user wallet, stake or scoring persistence yet.
- No automatic PREDICT resolver yet.

Use `docs/V05_LIVE_ROLLOUT_CHECKLIST.md` for the first controlled live activation.
