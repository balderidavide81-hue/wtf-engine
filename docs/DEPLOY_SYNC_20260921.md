# Deployment sync — 2026-09-21

This no-op deployment marker intentionally triggers a fresh Vercel production deployment from the current `main` HEAD.

Expected serverless functions after deployment:

- `/api/health`
- `/api/collect`
- `/api/scout`
- `/api/daily`

The previous production deployment was created from an intermediate commit while the multi-file Daily Queue block was still being committed.
