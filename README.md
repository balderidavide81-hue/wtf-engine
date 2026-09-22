# WTF Engine

WTF Engine turns real-world curiosities into lightweight playable content.

## Production baseline

v0.5 is live:

```
publisher/discovery feeds
  -> deterministic filters and canonical dedupe
  -> Luna Scout
  -> Luna Editor
  -> Neon
  -> authenticated editorial review
  -> published gameplay
```

## v0.6 source/media/feed work

`feature/0.6-rolling-sources-media` adds:

- GDELT topical discovery for animals/local oddities, sport, entertainment/culture,
  work/technology and records/lost-found;
- stronger pre-AI topic/source diversity;
- permanent player-facing anti-repeat independent of prompt version;
- RSS image metadata with an explicit media-rights gate;
- card category + interaction type (multiple choice / true-false / predict);
- Italian player-facing Editor output by default;
- public chronological `/api/feed` contract for future multi-refresh/day operation.

Third-party image binaries are never stored in Neon. Public image URLs are emitted only after media
usage is approved.

## API

- `GET /api/health`
- `GET /api/collect` — generation token
- `POST /api/scout` — generation token
- `POST /api/daily?limit=30` — generation token
- `GET|POST /api/editorial?date=YYYY-MM-DD` — editorial token
- `GET /api/gameplay-daily?date=YYYY-MM-DD`
- `GET /api/feed?limit=30&before=<ISO timestamp>` — requires v0.6 schema

Do not apply v0.6 schema or merge production until TypeScript and PostgreSQL
migration/idempotency validation passes.
