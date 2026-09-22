# Luna Editor inline v0.4

Player-facing output defaults to Italian.

New fields:
- `category`
- `interactionType`: `MULTIPLE_CHOICE`, `TRUE_FALSE`, `PREDICT`

Rules:
- TRUE_FALSE only for a crisp, unambiguous completed claim; use Vero/Falso (or True/False for English).
- MULTIPLE_CHOICE uses 2-4 distinct plausible options.
- PREDICT must be future/unresolved, use 2-4 objective mutually exclusive outcomes and a precise
  resolution rule; never assume the outcome in the draft reveal.
- STORY requires a concrete reason to follow updates.
