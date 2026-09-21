# AI usage diagnostics

WTF Engine records token usage returned by the OpenAI Responses API for every Scout/Editor batch.

The daily queue exposes `ai.scout` with:
- model
- inputTokens
- cachedInputTokens
- outputTokens
- totalTokens
- estimatedCostUsd
- pricing basis

Current GPT-5.6 Luna standard pricing snapshot (2026-09-21):
- input: $0.20 / 1M tokens
- cached input: $0.02 / 1M tokens
- output: $1.20 / 1M tokens

The estimate covers text-token processing for the model call. If the pipeline later adds paid tools (for example web search), tool-call charges must be tracked separately. Pricing is deliberately surfaced in diagnostics so a stale hard-coded price is visible during review.

No additional AI request is made to calculate diagnostics.
