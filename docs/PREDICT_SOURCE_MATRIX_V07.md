# WTF Engine — Structured PREDICT source matrix v0.7

## Why this exists

A PREDICT card is valid only when the outcome is still genuinely unknown at card creation and can later
be resolved from a named authoritative source. "Future date" alone is not enough.

The first implementation should favor a small number of source families with strong resolution
semantics instead of creating dozens of fragile integrations.

## Tier A — ready for a first automated adapter

### NOAA Space Weather Prediction Center — Planetary K-index

Forecast:
`https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json`

Observed resolution:
`https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json`

Why it fits:
- official U.S. government source;
- machine-readable JSON;
- forecast and later observation are distinct;
- allows genuinely unresolved time-bounded outcomes.

Example:
"Entro le prossime 24 ore il Kp osservato raggiungerà almeno 7?"

Important:
The answer must be resolved from observations published after the card closes, not from the forecast
that was already known when the card was created.

### NOAA Space Weather Alerts

`https://services.swpc.noaa.gov/products/alerts.json`

Useful for questions such as whether a specific objectively defined alert/threshold appears inside a
future time window. The outcome must not already be present when the card opens.

## Tier B — authoritative, start manual before automating

### Formula 1 official calendar and results

Calendar:
`https://www.formula1.com/en/racing/2026`

Official results:
`https://www.formula1.com/en/results/2026/races`

Good WTF/PREDICT families:
- winner / podium of a future race when the card is opened before qualifying/race resolution;
- whether an unusual announced technical experiment/debut actually appears at a named event;
- objectively defined race events only when the rule can be verified from official result pages.

Do not create routine sports betting inventory just because results are available. WTF Engine should
surface unusual or story-worthy angles.

### Academy Awards

Ceremony pages:
`https://www.oscars.org/oscars`

Official awards database:
`https://awardsdatabase.oscars.org/`

Use for unusual categories/stories only after official nominees exist. The Academy database is the
authoritative resolution source.

### Christie's official auction results

Upcoming/event discovery:
`https://www.christies.com/en/events`

Results:
`https://www.christies.com/en/results`

Strong PREDICT shape:
A weird/celebrity/historic object is announced for auction; ask a threshold or range question before
the auction closes, then resolve from the official result.

Avoid cards whose answer is effectively already fixed by a published guaranteed sale price.

## Tier C — excellent content, access/automation still under research

### Guinness World Records

News:
`https://www.guinnessworldrecords.com/news`

Latest:
`https://www.guinnessworldrecords.com/news/latest-news`

This is an excellent WTF source and a potentially excellent PREDICT resolution source for announced
record attempts. No public RSS/API integration is enabled yet; keep it manual/research-only until a
compliant access path and reuse policy are confirmed.

### NASA NeoWs

NASA Open APIs:
`https://api.nasa.gov/`

NeoWs data is highly structured, but most future close-approach values are already predictions
published by NASA. Asking users to "predict" a value that the source already provides would merely be
a quiz disguised as PREDICT.

Keep NeoWs in quiz/STORY/research status unless the card concerns a later observation that truly is
unknown at creation time.

## Contract for every PREDICT card

A valid PREDICT must have:

1. a unique external event identity;
2. opening time;
3. closing time before outcome resolution;
4. 2–4 objective mutually exclusive options;
5. a named official resolution source;
6. a resolution rule that can be evaluated without editorial opinion;
7. a later resolution timestamp/source update;
8. no answer inferable directly from data already supplied to the player at creation.

## Notifications

The future mobile subscription model should support:

- "seguimi su questa storia";
- update notification when material evidence changes;
- closing-soon reminder if enabled;
- resolved notification with correct/incorrect result;
- no noisy notification for every crawler refresh.

Subscription state belongs to user/account data, not to the article itself.
