# First real Editor card evaluation — v0.6.15 / v0.6.16

Date: 2026-09-22

## Purpose

Evaluate the first real player-facing card generation from the 16 `KEEP + SUPPORTED`
items produced by the second global Luna Scout run documented in
`docs/SECOND_GLOBAL_SCOUT_V0614.md`.

The test intentionally does not publish or persist any article/card/edition content.

## Input set

- 16 Scout KEEP candidates
- all 16 with `evidenceStatus=SUPPORTED`
- exact v0.6.14 Scout modes/scores/reasons reused
- default player-facing output language: Italian
- frozen candidate title/summary/source/geography supplied to Editor

The 13 candidates available during the snapshot run were captured directly from the collector.
The three Smithsonian candidates were recovered from their canonical source pages after the
Smithsonian feed timed out during that snapshot.

## Execution notes

The first combined probe attempted collector + Editor(12) + Editor(4) in one serverless request.
That exceeded the practical request window and was abandoned.

A second probe froze the 16 inputs and split generation into two independent 8-card calls.

### Batch 1

- submitted: 8
- returned: 8
- omitted: 0
- model: `gpt-5.6-luna`
- input tokens: 3,005
- output tokens: 1,666
- total tokens: 4,671
- engine-estimated cost: $0.0026002

### Batch 2 initial attempt

The model returned more than one card for the Renault 5 article. The existing duplicate guard
correctly rejected the batch.

This exposed a real Editor contract bug: the prompt did not explicitly require one card for every
candidate. v0.6.15 fixed this by requiring exact one-to-one cardinality, exact article IDs, no
omissions, no duplicates and no unexpected IDs. The same invariants are now validated inside
`OpenAIEditor`.

### Batch 2 retry after cardinality fix

- submitted: 8
- returned: 8
- omitted: 0
- model: `gpt-5.6-luna`
- input tokens: 3,234
- output tokens: 1,830
- total tokens: 5,064
- engine-estimated cost: $0.0028428

Known successful generation cost for the complete 16-card set:

- $0.005443

This does not include any spend from the failed/aborted probe attempts, whose usage was not
captured after the request/validation failures. The figure is an engine estimate, not a billing statement.

## Generated card mix

Modes:

- WTF: 15
- PREDICT: 1
- STORY: 0

Interaction types:

- MULTIPLE_CHOICE: 11
- TRUE_FALSE: 4
- PREDICT: 1

Categories:

- animals: 8
- records: 3
- transport: 2
- space: 1
- science: 1
- culture: 1

## What worked well

The Editor proved it can turn multilingual/global source material into concise Italian game cards
with valid schema and usable interaction mechanics.

Strong examples included:

- flipping 10 cups in 6.63 seconds;
- the 429-foot Slim Jim record;
- the 754 salt-and-pepper packet-pair collection;
- the chemical "ID card" in cat urine;
- the snake named after Slash;
- the 2,500-mile wild-dog journey;
- the 43-year-abandoned Renault 5 with 12 km;
- the California mastodon tooth;
- Norway's 98.7% electric registrations;
- the Bolivian wildcat;
- the Ethiopian egg-eating snake.

The Princess Diana auction item was correctly turned into a future `PREDICT` card rather than a
resolved trivia card.

Grounding was generally strong: hooks/questions/reveals stayed close to the supplied source material
and the first successful 8-card batch returned all cards without omission.

## Quality defects found

### 1. Hook answer leakage

At least two clear cases gave away too much before the question:

- the emu hook explicitly named the white emu before asking which animal was on the highway;
- the Bolivian wildcat hook said the recognition came after more than a century before a TRUE_FALSE
  question asked essentially that same fact.

### 2. Correct-answer position bias

Before deterministic balancing:

- MULTIPLE_CHOICE correct index 0: 8 / 11
- index 1: 1 / 11
- index 2: 2 / 11
- index 3: 0 / 11

Across all resolved interactions, 12 / 15 answers were at index 0 because all four TRUE_FALSE cards
were also "Vero".

This is too predictable for a game.

### 3. TRUE_FALSE triviality / all-true bias

All four TRUE_FALSE cards used `Vero` as the correct answer. Several were direct restatements of a
headline/summary fact rather than a genuinely deceptive or interesting binary challenge.

### 4. PREDICT option overlap

The Princess Diana auction draft used:

- sold;
- not sold;
- withdrawn before auction;
- auction postponed/cancelled.

"Not sold" can semantically overlap with withdrawal/postponement unless it is explicitly defined as
"offered at auction but no sale occurred".

### 5. Natural-language quality

One generated hook used the awkward Italian phrase `la Zambia` instead of natural `lo Zambia`.
The rest of the Italian was generally readable, but this shows the prompt should demand idiomatic
localization rather than literal translation.

### 6. Unsupplied derived fact

The Slim Jim reveal converted the supplied 429 feet 5.4 inches into approximately 131 meters.
The arithmetic is reasonable, but the original Editor contract said to use only supplied facts.
For strict grounding, derived conversions should not be added unless explicitly permitted.

## v0.6.16 hardening

Prompt version: `editor/inline-v0.6-gameplay-quality`

Merged source changes:

- hooks must tease without revealing the asked answer/value/name/truth value;
- output must be natural, idiomatic target-language copy;
- reveals cannot add unsupplied conversions, arithmetic or inferred quantities;
- distractors may be invented only as game options, never as reveal facts;
- TRUE_FALSE guidance discourages trivial headline restatements and systematic all-true answers;
- PREDICT options must be semantically non-overlapping;
- deterministic post-generation rotation distributes MULTIPLE_CHOICE correct answers across option
  positions while preserving correctness;
- one-to-one candidate/card cardinality validation from v0.6.15 remains enforced.

The v0.6.16 source passed Node 22 typecheck and is merged on `main`.

## Current deployment state

The production deployment for the v0.6.16 commit was rejected by Vercel with:

`Deployment rate limited — retry in 24 hours.`

Therefore the post-hardening 16-card regeneration could not be executed in this session. The last
successful live Editor output is the v0.6.15 baseline described above.

All deployed Editor probe leases used during the test were locked through 2099 before source cleanup,
so the still-live older deployment cannot accidentally trigger another paid probe.

## Next validation target

When a deployment containing v0.6.16 is available, rerun the same frozen 16 inputs and compare:

- hook answer leakage;
- MULTIPLE_CHOICE correct-index distribution;
- TRUE_FALSE truth-value balance;
- PREDICT outcome exclusivity;
- idiomatic Italian;
- reveal grounding;
- schema/cardinality;
- measured Editor cost.

Only after that comparison should the normal daily pipeline be allowed to persist/publish generated
cards automatically.
