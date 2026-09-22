# Source expansion and rolling-feed foundation v0.6

## Goal

Broaden WTF Engine beyond a science-heavy daily prototype into a continuously refreshable feed of
playable oddities across animals, sport, film/TV, music, culture, work, records, technology, transport,
food, travel, science and local life.

Paid AI remains bounded: deterministic discovery/dedupe happens first and Scout still receives at most
30 candidates per generation.

## Enabled discovery

Direct feeds retained: UPI Odd News, three Phys.org lanes and three New Atlas lanes.

v0.6.4 adds two direct discovery feeds:
- ScienceDaily Strange & Offbeat, using its official Strange & Offbeat RSS feed;
- Smithsonian Smart News, using Smithsonian Magazine's official Smart News RSS feed.

Both are link/discovery sources only. WTF Engine keeps canonical attribution and does not republish
article bodies. Third-party media is not cached or displayed unless separately approved.

v0.6.5 adds a deliberately multilingual regional pack instead of continuing to grow only US/English
sources:
- Rai Televideo Dall'Italia + Culture (Italian / Italy);
- The Conversation France (French);
- The Conversation Spain (Spanish);
- The Conversation Brasil (Brazilian Portuguese);
- The Conversation Indonesia (Bahasa Indonesia);
- The Conversation Australia (English);
- The Conversation Africa (English).

The goal is discovery breadth, not bulk. The paid Scout ceiling remains 30 candidates, and pre-AI
selection now also caps source geography before the final recency fallback. This prevents the global
feeds from being immediately re-dominated by whichever country published most recently.

Source language is canonical input data. We do not translate the entire discovery stream: Luna Scout
evaluates candidate text in the original language, while localization is deferred until after a story
becomes a game card. See `docs/GLOBAL_LOCALIZATION_FOUNDATION.md`.

v0.6.10 follows the first real multilingual Scout batch with two targeted corrections:

- cross-publisher near-story dedupe runs after deterministic playability ranking and before the paid
  Scout window, so paraphrased coverage of the same event consumes one slot instead of two;
- four focused curiosity-category feeds are added for Italy, France, Spain and Brazil. The goal is to
  improve non-English candidate quality rather than force generic per-language quotas.

The first live global Scout evaluation produced 13 KEEP, 11 MAYBE and 6 REJECT from 30 candidates.
The broad regional feeds supplied useful language coverage, but four non-English The Conversation
exploration items were all rejected, while two English publishers surfaced the same wild-dog journey.
v0.6.10 therefore improves source fit and duplicate control instead of lowering the quality threshold.

GDELT DOC 2.0 is no longer enabled by default. Live production tests returned HTTP 429 with five
thematic requests and again with one reduced global request plus one bounded retry. The adapter stays
available for controlled experiments with `WTF_ENABLE_GDELT=1`, but normal production collection
does not spend requests on it.

## Candidate sources not enabled by default

- Guinness World Records: excellent recurring WTF material, but no public RSS endpoint was confirmed;
  enable only after a compliant discovery/licensing path exists.
- Oddity Central: editorial fit is extremely strong and a legacy feed exists, but reuse/verification
  policy should be reviewed before automatic promotion.
- General sports/entertainment feeds: useful only if they do not swamp the 30-item paid Scout window;
  prefer tightly filtered or official event/result sources over broad firehoses.
- ANSA and Adnkronos: useful Italian editorial references, but their current RSS terms are not suitable
  for automatic commercial ingestion without a separate agreement.
- Euronews and EL PAÍS: public RSS/MRSS catalogues exist, but commercial-use terms require a clearer
  source-policy decision before automatic production enablement.

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
