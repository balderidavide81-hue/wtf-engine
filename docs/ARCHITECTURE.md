# WTF Engine architecture

## Phase 0

Goal: validate content supply before building the consumer app.

Pipeline:

1. ingest real-world candidates;
2. deterministic filtering/deduplication;
3. Luna Scout classification;
4. source/evidence verification;
5. editorial queue and human feedback;
6. later: Editor, QA, persistence and scheduling.

## Design rules

- AI work scales with stories, not end users.
- Generation and verification are separate concerns.
- Prompts and output contracts are versioned.
- Real failures become regression cases.
- Do not build product mechanics until the content engine proves useful.
