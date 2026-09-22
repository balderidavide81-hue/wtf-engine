# Source policy v0.6

WTF Engine uses direct publisher feeds plus discovery-radar feeds.

## Active direct feeds

- UPI Odd News
- Phys.org Plants & Animals
- Phys.org Archaeology
- Phys.org Space
- New Atlas Science
- New Atlas Technology
- New Atlas Transport

## Active discovery radar

GDELT DOC 2.0 ArticleList RSS is split into bounded query lanes for:

- animals/local oddities;
- sports;
- entertainment/culture;
- work/technology;
- records/lost-found.

GDELT is not presented to players as the source. The underlying publisher URL remains the
attribution/verification target.

## Ingestion rules

- ingest only metadata needed for discovery;
- retain canonical HTTP(S) source URLs;
- capture feed image metadata but default third-party media to `unreviewed`;
- deterministic duplicate/sensitivity filtering before AI;
- persistent player-facing anti-repeat independent of prompt version;
- never republish third-party article bodies;
- never expose/cache third-party images until media usage is approved.

## Operator controls

Additional feeds:

`WTF_RSS_SOURCES=Name|URL|language|country,Name 2|URL|language|country`

GDELT kill switch:

`WTF_ENABLE_GDELT=0`

## Promotion checklist

Before promoting a source, verify feed freshness, access/reuse/attribution terms, canonical URLs,
summary sufficiency and image rights separately.

See `docs/SOURCE_EXPANSION_V06.md` for candidate sources and structured PREDICT research.
