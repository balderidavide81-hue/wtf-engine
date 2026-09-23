# First persisted draft editorial audit — v0.6.20

Date: 2026-09-23
Edition: `2026-09-23`
Initial status: `draft`
Cards: 15

## Result before edits

The first persisted production draft was read back through the editorial store and audited card by
card. The edition-level answer-position balancing worked exactly as intended:

- 12 MULTIPLE_CHOICE cards;
- correct indexes: 3 / 3 / 3 / 3;
- 2 TRUE_FALSE cards with one correct answer at each index;
- 1 PREDICT card.

Twelve cards were editorially sound as generated. Three needed copy edits before review.

## Required edits

### Escaped sheep

Problem:
the hook said the animals made an uninvited "school visit", which made the correct destination
(a nearby high school) too easy.

Revised hook:

`Un piccolo gregge è scappato dal recinto e ha deciso di esplorare il vicinato.`

The question/options/reveal remain factually unchanged.

### Snake named after Slash

Problem:
the question included the scientific name `Lielaphis slashi`, while the correct answer was Slash.
Combined with the rock-themed hook, this made the answer too obvious.

Revised question:

`A quale musicista è stata dedicata la nuova specie di serpente?`

Revised options:

- Brian May
- Iggy Pop
- Slash
- Ozzy Osbourne

The answer remains Slash and the reveal remains grounded in the supplied source material.

### Bolivian wildcat

Problem:
the gameplay structure was sound after v0.6.18, but the reveal had awkward Italian grammar.

Revised reveal:

`Gli scienziati hanno identificato in Bolivia una nuova specie di gatto selvatico, la prima riconosciuta in oltre un secolo.`

## Grounding checks

The richer scientific reveals were checked against their public source pages:

- the California creek find is an ancient mastodon molar; Smithsonian also states that Pacific
  mastodons disappeared with other Ice Age megafauna around 11,700 years ago;
- the Quebec satellite-map discovery is a roughly 25-kilometer impact structure about 390 million
  years old, with shatter cones providing decisive field evidence;
- the eActros 600 source describes a planned 45,000 km round-the-world trip with a target of at most
  80 charging stops.

No additional source-derived defect requiring rejection was found.

## Editorial action

v0.6.20 adds a validated `edit_card` editorial action that can mutate card copy only while both the
edition and card are still in draft state. The current mode, interaction type and category remain
fixed. The revised full card is run through the same deterministic card validator before the database
write.

The production one-shot review completed successfully:

- all three edits were applied;
- all 15 cards revalidated;
- all 15 cards moved to lifecycle `reviewed`;
- edition `2026-09-23` moved from `draft` to `reviewed`;
- no card was rejected;
- no publication transition was executed.

The public gameplay endpoint was checked immediately afterward and returned
`404 published_edition_not_found`, confirming that a reviewed edition remains private until an
explicit publish action.

Publication is deliberately not part of this step.


## First publication and public gameplay smoke — v0.6.22

The reviewed edition was published in production on 2026-09-23 through the existing
`reviewed -> published` transition.

Publication verification:

- 15 / 15 reviewed cards remained in the edition;
- 14 non-PREDICT cards moved to lifecycle `published`;
- the single PREDICT card moved to lifecycle `open`;
- no card copy was changed during publication;
- no AI call was made by the publication step.

The public `GET /api/gameplay-daily?date=2026-09-23` endpoint returned HTTP 200 with all 15 cards.
For published WTF/STORY cards, `resolvedOptionIndex` and `reveal` remained null, confirming that
answers are not exposed before play. The open PREDICT card exposed its resolution rule but no outcome.

A production HTTP smoke test then submitted option 0 on a published WTF card through
`POST /api/gameplay-answer`. The endpoint returned HTTP 200 with the submitted choice, correctness,
the correct option index and reveal only after submission. The same endpoint rejected the open
PREDICT card with HTTP 404 `answerable_published_card_not_found`.

This completes the first end-to-end production path:

`collect -> Scout -> Editor -> persist draft -> editorial edits/review -> publish -> public play -> reveal after answer`.
