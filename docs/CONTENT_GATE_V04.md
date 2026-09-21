# Content gate v0.4

The next production deployment should be a single coherent test of the expanded pipeline.

Expected diagnostics:
- sourceCount / fetched / kept / errors
- bySource fetch counts
- deterministic drop reasons, including near-duplicates
- scouted (hard cap 30)
- editorEligible
- edited (hard cap 12)
- Scout token/cost diagnostics
- Editor token/cost diagnostics
- totalEstimatedCostUsd
- playable card drafts
- ranked/diversified queue

Acceptance checks:
1. one broken feed does not fail the whole run;
2. at least several sources actually return fresh candidates;
3. duplicate/syndicated stories do not dominate paid Scout input;
4. Editor receives only KEEP + SUPPORTED;
5. Editor never processes more than 12 stories per run;
6. cards do not invent facts absent from source material;
7. PREDICT cards have a future objective resolution rule;
8. output remains diverse enough to avoid a single repetitive lane.

This gate intentionally favors observability and bounded AI spend before database persistence or automated publishing.
