# WTF Engine

Experimental editorial engine for turning real-world news and curiosities into lightweight playable content.

## Phase 0 — content validation

The first milestone is deliberately small: validate that an automated pipeline can surface genuinely fun, surprising and playable stories every day before building the consumer app.

Initial pipeline:

```
sources -> ingest -> deterministic filters -> Luna Scout -> verification -> editorial queue
```

Target validation gate: for 7 consecutive days, automatically surface at least 5 candidates per day that are worth publishing/playing.

## Planned modules

- `src/ingest/` — source collectors
- `src/filters/` — deterministic filtering and deduplication
- `src/ai/` — Luna Scout / Editor / QA
- `src/verify/` — evidence and source verification
- `src/api/` — backend endpoints
- `prompts/` — versioned AI prompts
- `evals/` — golden cases and production failures
- `db/` — database schema/migrations
- `dashboard/` — lightweight editorial review UI
- `docs/` — architecture and decisions

## Status

Repository initialized. No production app or live pipeline yet.
