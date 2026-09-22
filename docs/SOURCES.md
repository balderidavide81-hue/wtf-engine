# Source policy v0.6

WTF Engine uses direct publisher feeds plus optional discovery-radar feeds.

## Active direct feeds

### Existing oddity / science discovery

- UPI Odd News — English / US
- Phys.org Plants & Animals — English / global
- Phys.org Archaeology — English / global
- Phys.org Space — English / global
- New Atlas Science — English / global
- New Atlas Technology — English / global
- New Atlas Transport — English / global
- ScienceDaily Strange & Offbeat — English / global
- Smithsonian Smart News — English / global

ScienceDaily and Smithsonian are treated as discovery/link sources: WTF Engine does not republish
their article bodies and third-party media remains link-only unless separately approved.

### Global multilingual source pack

- Rai Televideo Dall'Italia — Italian / Italy
- Rai Televideo Culture — Italian / Italy
- The Conversation France — French / France
- The Conversation Spain — Spanish / Spain
- The Conversation Brasil — Brazilian Portuguese / Brazil
- The Conversation Indonesia — Bahasa Indonesia / Indonesia
- The Conversation Australia — English / Australia
- The Conversation Africa — English / sub-Saharan Africa

Rai Televideo's public RSS page explicitly describes distribution of article title, summary and address
and says third-party blogs can syndicate the news. WTF Engine still treats Rai media as link-only.

The Conversation publishes under Creative Commons and operates local editions around the world.
WTF Engine currently uses these feeds only for discovery metadata and canonical source links; media
stays link-only unless separately cleared.

The source-language metadata is preserved. Non-English candidates are classified directly in their
original language; the collector does not pre-translate the firehose.

## Sources reviewed but not enabled automatically

Public RSS availability alone is not sufficient for commercial production use.

- ANSA: current RSS terms restrict use to personal/non-commercial news-reader use unless separately agreed.
- Adnkronos: current RSS terms likewise restrict redistribution/public use without agreement.
- Euronews: public MRSS feeds exist, but general terms restrict commercial exploitation of site content.
- EL PAÍS: extensive public RSS catalogue exists; historic material describes headline syndication, but
  current licensing/contact pages make commercial reuse sufficiently ambiguous that automatic production
  ingestion should wait for explicit source-policy review.

These can remain research/manual-reference sources without entering the automated collector.

## Optional discovery radar

GDELT DOC 2.0 remains implemented but is now opt-in only. Production tests returned HTTP 429 first
with five thematic requests, then again after collapsing to one bounded global request and retrying
once. Normal collection cycles therefore do not call GDELT.

If explicitly enabled, returned stories are classified locally and the underlying publisher URL,
not GDELT, remains the attribution/verification target.

## Ingestion rules

- ingest only metadata needed for discovery;
- retain canonical HTTP(S) source URLs;
- preserve original source language and source-geography metadata;
- capture feed image metadata but default third-party media to `unreviewed` or `link-only`;
- deterministic duplicate/sensitivity filtering before AI;
- protect source, topic and source-geography diversity before the paid Scout batch;
- persistent player-facing anti-repeat independent of prompt version;
- never republish third-party article bodies unless an explicit compatible license/policy is recorded;
- never expose/cache third-party images until media usage is approved.

## Operator controls

Additional feeds:

`WTF_RSS_SOURCES=Name|URL|language|country,Name 2|URL|language|country`

GDELT experimental opt-in:

`WTF_ENABLE_GDELT=1`

Unset/default means disabled.

## Promotion checklist

Before promoting a source, verify feed freshness, access/reuse/attribution terms, canonical URLs,
summary sufficiency, source language/geography and image rights separately.

See `docs/SOURCE_EXPANSION_V06.md` for source-expansion notes and
`docs/GLOBAL_LOCALIZATION_FOUNDATION.md` for the multilingual content strategy.
