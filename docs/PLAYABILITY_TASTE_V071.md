# Playability Taste Pass — v0.7.1

Status: source-only prompt refinement. No generation has been run with these prompt versions yet.

## Why

The first published edition proved that WTF Engine can reliably find and turn real stories into playable
cards. Playing those cards also exposed a more useful product distinction:

**unusual news is not automatically a good game card.**

The next quality step is to optimize for a satisfying setup -> guess -> reveal loop.

## Strong patterns from the first production edition

These are examples of premises that feel close to the intended product:

- escaped sheep wandering into a newly opened high school;
- a nearly 430-foot Slim Jim breaking a record;
- a parade horse escaping and triggering a chase through Santa Fe;
- a strange object in a creek turning out to be a mastodon tooth after reverse-image search;
- a newly described snake being named after a rock musician.

They work because the player can picture the scene, the premise is retellable, and the answer creates a
clear reveal.

## Patterns to down-rank

The first edition also contained cards that are factually valid but less distinctive as WTF gameplay:

- an ordinary market-share statistic framed as "what percentage?";
- a technical scientific finding whose main question asks the player to recall a specific count;
- questions where the number is incidental rather than the punchline.

These should not be banned. They should simply lose against more visual, social, bizarre or
consequence-driven stories.

## Scout v0.5

Scout now explicitly prefers candidates with at least one concrete play hook:

- bizarre behavior;
- striking object/place;
- visually absurd scale;
- surprising consequence;
- unusual record;
- strange social situation;
- future outcome with clear stakes.

It explicitly penalizes routine statistics, dry metrics and candidates whose only obvious game mechanic
is arbitrary numeric recall.

## Editor v0.9

Editor now treats hook + question as a setup/payoff pair.

Default question targets should be:

- action;
- object;
- identity;
- place;
- consequence;
- outcome.

Numeric questions remain valid when the number itself is the absurdity, such as a record or extreme
measurement.

The reveal should add the supported surprising fact/context rather than merely restating the correct
option.

## Comparison gate for the next real generation

When the next edition is generated, compare it against the first published edition on:

1. share of cards that are immediately understandable without specialist context;
2. share of questions that are non-arbitrary;
3. number of dry percentage/count questions;
4. number of cards with a clear retellable one-sentence premise;
5. editorial edits/rejects needed before publication;
6. how long a player voluntarily continues in the public Play Preview.

The prompt change is considered successful only if the next real batch feels better in play, not merely
if it passes deterministic validation.
