# Automatic Daily Queue v0.5

## Endpoint

`POST /api/daily?limit=30`

Requires:

`Authorization: Bearer <GENERATION_API_TOKEN>`

Production generation also requires `DATABASE_URL`. If persistence is not configured, the endpoint fails before collection/AI work.

## Pipeline

`configured RSS feeds -> collection -> deterministic filter/dedupe -> processed-story lookup -> Luna Scout -> diversity -> Luna Editor -> persistence -> draft daily edition`

Limits:
- Scout: maximum 30 candidates.
- Editor: maximum 12 KEEP + SUPPORTED candidates.

The response includes:
- collection/source diagnostics;
- count already processed;
- Scout submitted count and omitted IDs;
- Editor eligibility/submission/omission diagnostics;
- per-stage token/cost diagnostics;
- ranked/diversified queue;
- generated cards;
- persistence run/edition IDs when cards were produced.

This is an internal paid generation endpoint, not a gameplay endpoint. It is `no-store`; the database-backed generation lease rejects overlapping runs.
