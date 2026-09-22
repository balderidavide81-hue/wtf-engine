# Second real Editor evaluation — v0.6.17

Date: 2026-09-22

## Purpose

Regenerate the exact same frozen 16 `KEEP + SUPPORTED` candidates used by the first real Editor
evaluation, after the v0.6.16 gameplay-quality prompt hardening and v0.6.17 deterministic quality gate.

No Scout rerun, article/card/edition persistence or publication was performed.

## Execution

The same frozen 16 candidates were split into two independent 8-card production calls.

Prompt version:

- `editor/inline-v0.7-deterministic-quality`

Batch 1:

- submitted: 8
- returned: 8
- input tokens: 3,240
- output tokens: 1,732
- total tokens: 4,972
- engine-estimated cost: $0.0027264

Batch 2:

- submitted: 8
- returned: 8
- input tokens: 3,422
- output tokens: 2,090
- total tokens: 5,512
- engine-estimated cost: $0.0031924

Combined successful generation:

- submitted: 16
- returned: 16
- input tokens: 6,662
- output tokens: 3,822
- total tokens: 10,484
- engine-estimated cost: $0.0059188

The first successful 16-card baseline cost estimate was $0.005443, so the hardened run is about
8.7% more expensive while remaining well below one cent. These values are engine estimates, not
billing statements.

## Generated card mix

Modes:

- WTF: 14
- PREDICT: 2
- STORY: 0

Interaction types:

- MULTIPLE_CHOICE: 11
- TRUE_FALSE: 3
- PREDICT: 2

Categories:

- animals: 7
- records: 2
- food: 1
- space: 1
- science: 2
- transport: 2
- culture: 1

## Correct-answer position comparison

First baseline MULTIPLE_CHOICE distribution:

- index 0: 8 / 11
- index 1: 1 / 11
- index 2: 2 / 11
- index 3: 0 / 11

v0.6.17 MULTIPLE_CHOICE distribution:

- index 0: 1 / 11
- index 1: 4 / 11
- index 2: 5 / 11
- index 3: 1 / 11

This is a major improvement over the original first-option bias, though the current per-article hash
still produces a middle-heavy distribution on this specific 11-card set.

TRUE_FALSE position distribution:

- index 0: 2 / 3
- index 1: 1 / 3

TRUE_FALSE truth-value balance:

- true statements: 2
- false statements: 1

The baseline had four TRUE_FALSE cards and all four were true.

## Improvements confirmed

### 1. Emu hook leakage fixed

Baseline behavior gave away the animal before asking which animal appeared on the highway.

v0.6.17 hook:

> Una corsia di sorpasso si è trasformata nel territorio di un animale davvero inatteso.

The question then asks which animal it was. The answer is no longer exposed in the hook.

### 2. Derived conversion removed

The baseline Slim Jim card added an unsupplied metric conversion.

v0.6.17 keeps only the supplied measurement:

- 429 feet and 5.4 inches

No derived metric conversion is added.

### 3. PREDICT outcome overlap fixed

Both auction PREDICT cards now distinguish:

- sold;
- offered at auction but unsold;
- withdrawn before auction;
- auction postponed or cancelled.

The previous ambiguous overlap between “not sold” and withdrawal/postponement is therefore removed.

### 4. PREDICT selection improved

The Renault 5 item is now correctly drafted as PREDICT instead of resolved WTF trivia because the
auction outcome is genuinely future and unresolved.

Princess Diana's dress remains a PREDICT card.

### 5. TRUE_FALSE variety improved

The Ethiopian egg-eating snake card uses a deliberately false statement:

- claim: the snake eats mammal eggs;
- correct answer: Falso;
- reveal: it feeds exclusively on birds' eggs.

This removes the previous all-true pattern.

### 6. Italian localization improved

The prior awkward `la Zambia` wording does not recur. The new cards are generally idiomatic and
readable Italian rather than literal translations.

### 7. Cardinality and schema held

Both batches returned exactly one valid card for every submitted candidate:

- 16 submitted
- 16 returned
- zero omissions
- zero duplicates
- zero unexpected article IDs

The deterministic post-generation validator accepted all final cards.

## Residual defects

### 1. Semantic hook leakage remains possible

The Bolivian wildcat card passed the exact-string leakage guard but still reveals the answer
semantically:

Hook:

> Dopo oltre un secolo, la famiglia dei felini selvatici ha accolto una nuova specie.

Question:

> Che cosa è stato scoperto in Bolivia?

Correct answer:

> Una nuova specie di felino selvatico

This is not an exact textual duplicate, so the deterministic guard does not catch it. The prompt needs
stronger guidance against paraphrasing the answer category into the hook.

### 2. Answer positions are improved but not batch-balanced

The per-article deterministic hash removes the extreme index-0 bias, but this concrete batch lands
5/11 MULTIPLE_CHOICE answers at index 2 and only 1/11 at indexes 0 and 3.

A batch-level deterministic allocator can guarantee near-even answer-position distribution without
another AI call.

### 3. One minor unsupplied adjective

The Slim Jim hook calls it a `popolare snack di carne`. “Popular” was not present in the frozen source
material. This is minor and does not change the answer, but strict grounding should avoid unsupplied
evaluative adjectives such as popular/famous/iconic unless they are supplied by the source.

## Overall conclusion

The Editor is materially better than the first baseline:

- exact hook leakage protection works;
- answer-index predictability is greatly reduced;
- TRUE_FALSE is no longer systematically true;
- PREDICT outcomes are cleaner and more objective;
- derived unsupplied arithmetic/conversions disappeared;
- Italian localization improved;
- one-to-one card generation is reliable.

The remaining issues are narrow enough to harden without redesigning the pipeline.

The current output is suitable for persisted **draft/review** cards, but automatic publication should
remain gated until semantic hook leakage and batch-level answer balancing receive one final hardening
pass.

## v0.6.18 final hardening

The first three recommended fixes were implemented source-only:

- deterministic answer balancing now operates across the whole generated batch rather than hashing each
  card independently;
- prompt guidance explicitly forbids semantic/paraphrased answer leakage in hooks;
- prompt guidance explicitly forbids unsupplied evaluative factual adjectives such as
  popular/famous/iconic/legendary.

Validation PASS:

- 11 synthetic four-option MULTIPLE_CHOICE cards distributed 3 / 2 / 3 / 3;
- 3 TRUE_FALSE cards distributed 2 / 1;
- correct answers remained correct after rotation;
- card order remained stable;
- PREDICT cards were unchanged;
- Node 22 typecheck passed.

Prompt version: `editor/inline-v0.8-final-hardening`.

## Recommended next step

Run a small targeted live regression on the two remaining real defects from this evaluation:

- Bolivian wildcat semantic hook leakage;
- Slim Jim unsupplied `popolare` adjective.

If those regressions pass, enable the normal daily pipeline to persist generated cards as **drafts for
editorial review**, not automatic publication.
