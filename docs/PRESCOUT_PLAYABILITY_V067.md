# Pre-Scout playability ranking v0.6.7

## Why

The global source pack deliberately includes broad regional publishers. Recency plus diversity alone can
therefore fill the paid Scout window with serious explainers, routine politics, health reporting or
ordinary local news.

WTF Engine should not ask AI to discover that obviously generic material is generic.

The deterministic layer is a ranking system, not a replacement editor.

## Paid-window split

For the normal 30-candidate Scout ceiling:

- roughly 20 slots are reserved for candidates with a deterministic playability score >= 10;
- roughly 10 slots remain exploratory and globally diverse;
- fallback passes can still fill all capacity when the pool is sparse.

This avoids both extremes:

1. paying Scout for 30 merely recent stories;
2. hard-coding a closed definition of "WTF" that prevents discovery of new kinds of playable stories.

## Positive signals

Current multilingual hints include:

- world records and record attempts;
- escaped/loose animals and unusual rescues;
- lotteries and surprising prizes;
- auctions, rediscoveries and unusual finds;
- explicit weird/unusual language;
- first-ever, largest/smallest/rare-event language;
- animal-event language;
- modest source priors for feeds dedicated to odd/offbeat material.

Signals are supported in the source languages currently enabled by the collector.

## Negative signals

Soft demotions include:

- serious health/medical reporting;
- ordinary crime/court reporting;
- policy/politics/regulation;
- generic explainer/question headlines.

These are not hard bans. A genuinely playable story can still overcome a negative signal with stronger
positive evidence and Scout remains the editorial authority.

## Hard sensitivity boundary

The deterministic prefilter already rejects entertainment built around severe harm. v0.6.7 expands that
boundary from English/Italian to French, Spanish, Portuguese and Indonesian, including death, homicide,
sexual violence, terrorism and missing/kidnapped children.

This happens before paid AI.

## Diversity remains separate

Playability score does not mean "US odd news wins everything".

Selection still tracks:

- publisher;
- editorial lane/topic;
- source geography.

The quality-reserved block may relax caps when necessary, while the exploration block retains geographic
and publisher breadth. Event geography is not used as a quality signal.

## Evaluation

The live pre-v0.6.7 batch contained broad medical/crime/explainer material because selection was driven
mainly by recency and caps.

The final live validation produced:

- 794 fetched;
- 765 kept;
- 28 sensitive candidates removed before AI;
- 30 selected;
- 20/30 candidates at deterministic quality score >= 10;
- 26/30 with at least one positive playability signal;
- 0 negative-only candidates;
- all six live source languages represented: English, Italian, Indonesian, Spanish, French and Brazilian Portuguese.

Synthetic safety fixtures also verify that missing minors and domestic violence are rejected before paid
AI, and accented multilingual policy terms are recognized by the soft demotion layer.
