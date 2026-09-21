# Deployment sync — 2026-09-21

This deployment marker intentionally triggers a fresh Vercel production deployment from the current `main` HEAD.

Expected serverless functions after deployment:

- `/api/health`
- `/api/collect`
- `/api/scout`
- `/api/daily`

The duplicate Vercel project `wtf-engine-bwpo` has been removed. This marker triggers a single deployment of the corrected Scout schema, after removing the unsupported `uniqueItems` keyword.
