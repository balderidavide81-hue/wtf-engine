# WTF Engine architecture

## Current v0.5 shape

WTF Engine separates paid content generation from cheap gameplay reads.

```
verified/configured RSS feeds
  -> collection
  -> deterministic sensitivity + duplicate filtering
  -> source-balanced candidate selection
  -> Luna Scout
  -> editorial-lane diversification
  -> Luna Editor
  -> Neon persistence
  -> human editorial review
  -> daily-edition publication
  -> public gameplay read API
```

## Trust boundary

Scout's evidence status is based on the candidate material supplied to the model. It is not an independent source-verification pass.

Before publication, the editorial surface exposes the original source name, title and canonical URL for human review. The `src/verify/` module currently defines only a future verification interface; no automated independent verifier is active yet.

## Data / cost boundary

AI work scales with stories, not players.

- `/api/daily` and `/api/scout` are protected internal paid surfaces.
- `/api/daily` fails closed if persistence is not configured, so a production generation call cannot intentionally spend AI and then discard the result.
- gameplay clients read only already-published database content.
- prompt/model/cost provenance is persisted with generation runs.
- previously processed canonical stories are removed before paid Scout work.

## Editorial lifecycle

Daily edition:

`draft -> reviewed -> published`

Card lifecycle:

`draft -> reviewed -> published`

PREDICT after publication:

`reviewed -> open -> resolved|void`

Individual card review state freezes when an edition leaves `draft`. PREDICT adjudication is an authenticated editorial operation and requires evidence for resolution.

## Design rules

- generation and gameplay reads stay separate;
- expensive endpoints fail closed;
- prompts and model provenance remain explicit;
- deterministic filters run before AI;
- real production failures become regression cases;
- no real-money/cash-out mechanics;
- do not treat Scout classification as independent fact verification;
- enforce paid generation single-flight through the expiring database-backed generation lease.
