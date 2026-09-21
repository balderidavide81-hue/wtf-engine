# Daily playable pipeline

Current coherent gate:

1. collect from verified RSS sources;
2. deterministic prefilter/dedupe;
3. Luna Scout classification;
4. editorial-lane diversification;
5. Luna Editor drafts cards only from KEEP + SUPPORTED;
6. return raw queue, playable card drafts, per-stage token usage and total estimated AI cost.

The API therefore exposes:
- collection metrics;
- scouted count;
- ai.scout diagnostics;
- ai.editor diagnostics;
- ai.totalEstimatedCostUsd;
- cards;
- ranked/diversified queue.

The Editor does not independently verify claims yet. A verification stage remains required before publication. PREDICT and STORY drafts are drafts, not automatically publishable.
