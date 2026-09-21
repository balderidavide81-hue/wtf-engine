# Luna Scout API v0.1

## Endpoint

`POST /api/scout`

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

Maximum batch: 30 candidates.

The endpoint uses `OPENAI_API_KEY` server-side and returns structured Scout results.
The API key must never be sent by the client.

Default model: `gpt-5.6-luna`. It can be changed with `OPENAI_SCOUT_MODEL`
without changing application code.

## Separation of concerns

Scout ranks playability and editorial fit. It is not the final verifier.
A KEEP result does not authorize publication by itself; verification remains a
separate stage before a story is published.
