# Luna Scout diagnostics API v0.5

## Endpoint

`POST /api/scout`

Requires:

`Authorization: Bearer <GENERATION_API_TOKEN>`

This endpoint is an internal paid diagnostic surface. It must not be called from the consumer app.

Body:

```json
{
  "candidates": [
    {
      "id": "example-1",
      "sourceName": "Example",
      "sourceUrl": "https://example.com/story",
      "title": "A surprising real-world story",
      "summary": "Optional source-derived summary",
      "publishedAt": "2026-09-21T00:00:00Z",
      "language": "en",
      "country": "US"
    }
  ]
}
```

Maximum batch: 30 candidates. Request fields and aggregate payload size are bounded before the model call.

The endpoint returns structured Scout results plus token/cost diagnostics.

Default model: `gpt-5.6-luna`. It can be changed with `OPENAI_SCOUT_MODEL`.

## Evidence meaning

Scout ranks playability and editorial fit. Its `SUPPORTED` status means the supplied candidate material supports the classification. It is not independent fact verification and does not authorize publication by itself.
