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
- ScienceDaily Strange & Offbeat
- Smithsonian Smart News

ScienceDaily and Smithsonian are treated as discovery/link sources: WTF Engine does not republish
their article bodies and third-party media remains link-only unless separately approved.

## Optional discovery radar

GDELT DOC 2.0 remains implemented but is now opt-in only. Production tests returned HTTP 429 first
with five thematic requests, then again after collapsing to one bounded global request and retrying
once. Normal collection cycles therefore do not call GDELT.

If explicitly enabled, returned stories are classified locally and the underlying publisher URL,
not GDELT, remains the attribution/verification target.

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

GDELT experimental opt-in:

`WTF_ENABLE_GDELT=1`

Unset/default means disabled.

## Promotion checklist

Before promoting a source, verify feed freshness, access/reuse/attribution terms, canonical URLs,
summary sufficiency and image rights separately.

See `docs/SOURCE_EXPANSION_V06.md` for candidate sources and structured PREDICT research.
