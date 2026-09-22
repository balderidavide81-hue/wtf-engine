# Source expansion and rolling-feed foundation v0.6

## Goal

Broaden WTF Engine beyond a science-heavy daily prototype into a continuously refreshable feed of
playable oddities across animals, sport, film/TV, music, culture, work, records, technology, transport,
food, travel, science and local life.

Paid AI remains bounded: deterministic discovery/dedupe happens first and Scout still receives at most
30 candidates per generation.

## Enabled discovery

Direct feeds retained: UPI Odd News, three Phys.org lanes and three New Atlas lanes.

GDELT DOC 2.0 ArticleList RSS is used as a discovery radar, not the publisher of record. After live
testing showed HTTP 429s when five thematic requests were issued from one collection cycle, v0.6.2
collapses discovery into one bounded 48-hour global query. Category/lane assignment is performed
locally from the returned title/summary, so the external API is called only once per cycle. The
underlying publisher URL remains the attribution and verification target.

Set `WTF_ENABLE_GDELT=0` for an immediate kill switch.

## Candidate sources not enabled by default

- ScienceDaily Strange & Offbeat: excellent fit and frequent RSS, but RSS reuse terms require a
  commercial-use review before promotion.
- Smithsonian Smart News: excellent breadth, but Smithsonian content has commercial-use restrictions
  unless permission/open-access status applies.
- Guinness World Records: excellent recurring WTF material, but no public RSS endpoint was confirmed;
  enable only after a compliant discovery/licensing path exists.

## Media strategy

Neon stores metadata only: original image URL, optional cached/CDN URL, alt text and usage status.
No image binary belongs in Postgres.

Newly discovered third-party media defaults to `unreviewed`. Public gameplay emits an image only for
`remote-display`, `cache-allowed` or `owned` media. A future cache worker should resize/cache only
images for published cards, never the whole discovery pool.

## Permanent anti-repeat

Prompt-version dedupe is retained for model evaluation. A second player-facing boundary treats a story
as known once it has a non-rejected card, independent of prompt version. Matching uses canonical URL
plus PostgreSQL trigram title similarity.

## Rolling feed

v0.6 adds `GET /api/feed`, ordered by card `published_at`. The existing daily edition remains the
publication mechanism for now, but the mobile contract no longer depends on a single calendar page.
A later drop/slot migration can move to roughly 3-hour refreshes without changing the feed API.

## Structured PREDICT research

Prefer events with a future deadline and reliable resolution source:

- official sport schedules/results and unusual record attempts;
- official motorsport/event result pages;
- NASA/JPL structured event data when the outcome is genuinely unresolved rather than already known
  orbital data;
- official award/festival winner pages;
- auction-house result pages for unusual lots;
- official product/launch announcements;
- Guinness result pages for announced record attempts once access/reuse is cleared.

Do not create PREDICT merely because something occurs in the future. Outcomes must be objective,
mutually exclusive and resolvable from named evidence.
