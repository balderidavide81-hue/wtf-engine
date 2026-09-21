# Automatic Daily Queue v0.1

`GET /api/daily?limit=30`

Pipeline:

`verified feeds -> RSS collector -> deterministic filter/dedupe -> Luna Scout -> ranked editorial queue`

No article batch is supplied by the caller. The endpoint discovers current candidates itself.

The response contains:
- source count
- raw fetched count
- post-filter kept count
- number sent to Luna
- ranked candidates with Scout decisions and scores

This is a validation endpoint, not yet a scheduled production job. The next validation gate is to run it repeatedly and judge whether it surfaces at least five genuinely playable/publishable stories per day.
