# WTF Engine

WTF Engine turns real-world curiosities into lightweight playable content.

## Production baseline

v0.6 is live:

```
publisher/discovery feeds
  -> deterministic filters, canonical dedupe and story anti-repeat
  -> Luna Scout
  -> Luna Editor
  -> Neon
  -> authenticated editorial review
  -> chronological public gameplay feed
```

Current v0.6 capabilities:

- GDELT topical discovery for animals/local oddities, sport, entertainment/culture,
  work/technology and records/lost-found;
- stronger pre-AI topic/source diversity;
- permanent player-facing anti-repeat independent of prompt version;
- RSS image metadata with an explicit media-rights gate;
- card category + interaction type (multiple choice / true-false / predict);
- Italian player-facing Editor output by default;
- public chronological `/api/feed` contract for future multi-refresh/day operation;
- source-only structured PREDICT resolution contracts and official-source registry, with automation still disabled.

Third-party image binaries are never stored in Neon. Public image URLs are emitted only after media
usage is approved.

## API

- `GET /api/health`
- `GET /api/collect` — generation token
- `POST /api/scout` — generation token
- `POST /api/daily?limit=30` — generation token
- `GET|POST /api/editorial?date=YYYY-MM-DD` — editorial token
- `GET /api/editorial-audit?date=YYYY-MM-DD` — editorial token, read-only deterministic edition audit
- `GET /api/editorial-gate?through=YYYY-MM-DD&days=7&minActive=5` — editorial token, read-only multi-day gate
- `GET /api/predict-source-health?source=<id>` — editorial token, manual registered-source runtime probe
- `GET /api/editorial-metrics?date=YYYY-MM-DD` — editorial token, requires telemetry migration 003
- `GET /api/gameplay-daily?date=YYYY-MM-DD`
- `GET /api/feed?limit=30&before=<ISO timestamp>`

The v0.6 schema migration was validated on PostgreSQL 18, prepared on a temporary Neon branch,
verified there and applied to the production Neon main branch before the v0.6 source merge.


Manual editorial operations: the internal console can trigger the authenticated daily-generation endpoint explicitly; no cron is configured.


## Play preview

The public mobile-first gameplay preview is available at `/play/`. It consumes the production feed and
answer APIs, keeps PREDICT unresolved, and exposes sources only as part of the gameplay/reveal flow.
