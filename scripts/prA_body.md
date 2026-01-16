Summary:
- Adds aggregation helper for telemetry alerts: `lib/telemetry/aggregation.ts` which accumulates events in a rolling window and produces concise summaries (count + samples) when forwarding conditions are met.

Details:
- In-memory aggregation for local and initial staging use; supports Redis-backed aggregation behind `TELEMETRY_AGGREGATION_ENABLED` and `TELEMETRY_REDIS_URL`.
- Primary API: `recordAggregateEvent({ key, message, now, sampleSize })` → returns `{ count, shouldForward, samples }`.
- Unit tests validate windowed counting, sample preservation, and reset semantics.

Why:
- Reduces alert noise by forwarding aggregated summaries rather than raw event bursts; works with existing alert route to provide summarized messages to configured webhooks.

Testing:
- Unit tests for aggregation behavior (windowing, samples); integration tests for route to follow in next steps.

Rollout plan:
- Feature flag: `TELEMETRY_AGGREGATION_ENABLED=false` by default;
- Staging: enable Redis and `TELEMETRY_AGGREGATION_ENABLED=true` to verify aggregated summaries are forwarded correctly; tune `TELEMETRY_AGGREGATION_WINDOW_MS` and `TELEMETRY_AGGREGATION_SAMPLE_SIZE` as needed.

Notes:
- This PR is preparatory work (scaffolding + tests). Do not open this PR until PR #16 merges and CI is quiet, per the stabilization plan.