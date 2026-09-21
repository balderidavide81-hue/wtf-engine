# Source portfolio — expansion plan

Goal: stop depending on one US odd-news feed while keeping ingestion legal, stable and cheap.

## Promotion rule

A source is not enabled in `DEFAULT_SOURCES` until its machine-readable feed is verified for:
1. current availability and freshness;
2. stable canonical URLs and timestamps;
3. enough title/summary material for Scout;
4. acceptable reuse/attribution terms.

This prevents a speculative URL from breaking the collector.

## High-value source families

### Tier A — direct WTF yield
- UPI Odd News — enabled.
- Guinness World Records — records, collections, food, gaming, science/tech, sports, unusual skills.
- Euronews “Unusual” — European/global festivals, stunts, traditions, odd public events.
- ABC Australia topic feeds/pages — animal behaviour, unusual local incidents, wildlife, strange discoveries.

### Tier B — discovery/science
- Smithsonian Smart News / Good News — unusual animals, rediscoveries, archaeology, wholesome discoveries.
- Phys.org — **verified RSS provider**. Enabled lanes: Plants & Animals, Archaeology, Space. Phys.org explicitly documents free RSS use including commercial use with attribution; headlines/links must not be altered. Keep source credit/link in downstream cards.
- Atlas Obscura — unusual places, customs, food, objects and historical curiosities. Treat evergreen features separately from current news.
- New Atlas — **official RSS directory verified**. Enabled discovery lanes: Science, Technology, Transport. Broad feeds are intentionally sent through Scout; they add robotics, bizarre vehicles, unusual engineering and science but should not bypass playability scoring.

### Tier C — general-news discovery
Major international/local publishers can contribute high-quality WTF stories even without a dedicated odd-news desk. These should enter through verified topic/search feeds and still pass Scout + verification.

## Geographic target

The mature portfolio should intentionally cover:
- North America
- Latin America
- Europe
- Africa
- South Asia
- East/Southeast Asia
- Australia/New Zealand

Do not let one country exceed the daily queue merely because it has a prolific feed.

## New editorial lanes

Scout should actively recognize these as potentially playable, not automatically KEEP them:

- **Animal chaos:** harmless animals in human places, escapees, commuters, unexpected visitors.
- **Absurd records:** food, collections, costumes, endurance, mass participation, tiny/huge objects.
- **Bizarre competitions:** air guitar, finger wrestling, wife carrying, bog snorkelling, unusual races.
- **Festivals and traditions:** food fights, costume events, local rituals, unusual annual celebrations.
- **Accidental discoveries:** cheap object becomes valuable, object found in wall/attic/river, mistaken identity with a clean reveal.
- **Auction weirdness:** unusual memorabilia/objects with a future hammer price → strong PREDICT/STORY lane.
- **Naming chaos:** funny official names for animals, storms, public objects, mascots, snowplows, boats.
- **Public votes:** ugliest dog, favourite flower, naming contests, awards with objective future results.
- **Transport absurdity:** animal passengers, strange cargo, unusual delays, bizarre vehicles.
- **Food WTF:** giant foods, odd recipes/products, novelty restaurants, food records and competitions.
- **Science WTF:** weird species, surprising animal behaviour, robots doing unexpected things, odd experiments; require strong evidence.
- **Archaeology/history reveals:** strange objects or discoveries with a surprising factual reveal; avoid tragedy framing.
- **Internet-to-real-world:** harmless viral trends that create a verifiable real event.
- **Celebrity/pop-culture oddity:** public, sourced stunts, records, auctions, costumes, unusual releases; no gossip presented as fact.
- **Brand/product absurdity:** genuinely launched strange products, collaborations, packaging, vending machines; avoid disguised advertising.
- **Bureaucratic absurdity:** harmless official mistakes, comically specific rules, signs, forms or civic decisions when well sourced.
- **Weather/nature spectacle:** unusual but non-tragic natural phenomena, strange seasonal events, odd local conditions.
- **Lost-and-found:** extreme overdue returns, objects reunited after decades, bizarre items recovered.
- **Human skill:** improbable but safe feats, speed/precision/collection challenges.
- **Architecture/design WTF:** unusually shaped buildings, tiny homes, giant objects, surreal installations.
- **Language/signage:** verified translation/sign/name mishaps with broad accessibility and no humiliation target.

## Diversity guardrails

A good daily slate is not 12 animal stories or 8 lottery wins.
Target later:
- max 2-3 cards from the same editorial lane in the final daily slate;
- max 1-2 repetitive lottery stories;
- mix countries/continents;
- mix WTF/PREDICT/STORY;
- reward visual/shareable hooks;
- sensitivity remains a hard negative signal.

Source breadth improves discovery. Editorial diversity determines whether the game stays funny.


## Verification notes — 2026-09-21

- Phys.org: official RSS directory verified; direct XML endpoints confirmed for Plants & Animals, Archaeology and Space. Official terms on the feed directory permit personal/commercial use, require Phys.org credit, and prohibit altering feed headlines/links.
- ABC Australia: do **not** enable via RSS. ABC's current help page states its RSS feeds are no longer updated. It remains a useful editorial/source-discovery target through a future compliant non-RSS adapter, not through stale feeds.
- Guinness World Records: valuable editorial target, but no current official RSS endpoint was verified in this pass; remains disabled rather than guessing a feed URL.
- Euronews Unusual: valuable editorial target, but a dedicated current machine-readable Unusual feed was not verified in this pass; remains disabled.


- New Atlas: official RSS directory verified on 2026-09-21. Science, Technology and Transport feeds enabled. Its Science feed is currently served on the publisher-linked Refractor domain listed by New Atlas itself.
- Smithsonian Magazine: official RSS directory verified, but not enabled in this commit pending a tighter category selection and ingestion check; remains a high-value candidate for history/science oddities.
- ScienceAlert: strong science discovery source, but no official RSS endpoint was verified in this pass; not enabled.
- Oddity Central: extremely high raw WTF yield, but secondary-source quality and sensitive/crime-heavy stories mean it should not be trusted as sole evidence. Keep as a future discovery-only adapter with mandatory independent verification rather than promoting it directly to default RSS.
