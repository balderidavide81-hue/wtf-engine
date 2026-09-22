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

### Focused regional curiosity feeds

v0.6.10 adds category feeds that are explicitly narrower than a general news firehose:

- InsideEVs Italia Curiosita — Italian / Italy / transport curiosities
- Motor1 France Insolite — French / France / unusual transport
- Motor1 Espana Curiosidades — Spanish / Spain / transport curiosities
- InsideEVs Brasil Curiosidades — Brazilian Portuguese / Brazil / transport curiosities

Each publisher's RSS directory describes its RSS feeds as a free service and exposes the category feed
directly. WTF Engine ingests only title/summary/canonical-link discovery metadata and keeps media
link-only. A small source prior helps these focused feeds compete with broad English sources without
guaranteeing them a paid Scout slot.

### Broader regional world pack

v0.6.11 promotes one additional focused regional source after source-policy, transport-reliability
and live quality gates:

- Motor1 Argentina Curiosidad — Spanish / Argentina / official category RSS.

Motor1 Argentina exposes category RSS feeds as a free service to its users. The Argentina
`Curiosidad` feed receives the same modest focused-curiosity prior as the already validated Motor1 /
InsideEVs feeds for France, Spain, Italy and Brazil; it still has to earn a Scout slot through normal
playability and diversity caps.

Several technically healthy regional feeds were tested but deliberately not promoted because their
current top items had weak deterministic WTF playability: TimesLIVE Lifestyle, TimesLIVE Motoring,
The Standard Magazines, The Standard Entertainment and Global Voices Japan. Clarín Autos briefly
produced a viable Argentina candidate, but repeated GitHub-runner validation exposed intermittent
timeouts even with a bounded retry, so it was replaced rather than promoted.

The Tokyo was also evaluated separately. Its programmatic feeds are free and its site-authored
excerpts/metadata are CC BY 4.0, but the current 50-item Atom feed produced no positive deterministic
WTF signals and no Scout-slot candidate in validation. It therefore remains a research source rather
than adding permanent collector volume.

## Sources reviewed but not enabled automatically

Public RSS availability alone is not sufficient for commercial production use.

- ANSA: current RSS terms restrict use to personal/non-commercial news-reader use unless separately agreed.
- Adnkronos: current RSS terms likewise restrict redistribution/public use without agreement.
- Euronews: public MRSS feeds exist, but general terms restrict commercial exploitation of site content.
- EL PAÍS: extensive public RSS catalogue exists; historic material describes headline syndication, but
  current licensing/contact pages make commercial reuse sufficiently ambiguous that automatic production
  ingestion should wait for explicit source-policy review.
- SoraNews24 / RocketNews24: editorial fit for Japan/Asia is excellent, but SoraNews24's partnership page
  routes RSS/article contribution and distribution through a contact/partner arrangement. Keep them as
  research candidates until reuse terms for automated commercial discovery are explicitly cleared.
- The Straits Times: official Life RSS exists, but current site terms are not permissive enough for automatic
  production promotion without a separate source-policy decision.
- The Times Post (South Africa): current RSS terms prohibit non-personal display on mobile devices and
  monetization/redistribution of the feed, so it is not suitable for the planned mobile game.
- The South African: strong offbeat editorial fit exists, but current pages retain copyright and no
  sufficiently permissive RSS/reuse policy was confirmed for automated commercial promotion.
- Vantage Ke / Viral Tea: public category feeds exist, but current terms prohibit reproduction/distribution
  without prior written consent; keep research-only unless explicit permission is obtained.
- Tokyo Weekender: current editorial fit is excellent (recent mascot, sleep-race, robot and other locally
  specific oddities), but no sufficiently clear RSS/reuse route was confirmed for automated production.
- The Tokyo: source-policy is compatible (free feeds, CC BY 4.0 excerpts/metadata), but its current general
  feed failed the quality-yield gate; reconsider only with a sufficiently focused category/query feed.

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
