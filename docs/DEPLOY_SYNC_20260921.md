> Historical v0.4 deployment note. Do not use this file as the v0.5 rollout procedure; use `docs/V05_LIVE_ROLLOUT_CHECKLIST.md`.

# Deployment sync — 2026-09-21

This deployment marker intentionally triggers a fresh Vercel production deployment from the current `main` HEAD.

Expected serverless functions after deployment:

- `/api/health`
- `/api/collect`
- `/api/scout`
- `/api/daily`

The duplicate Vercel project `wtf-engine-bwpo` has been removed. This marker triggers a single deployment of the corrected Scout schema, after removing the unsupported `uniqueItems` keyword.
