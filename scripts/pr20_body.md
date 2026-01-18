Summary:
- Adds a server-side alert route POST /api/telemetry/alert which receives small alert payloads from the client telemetry helper and forwards them to a configured webhook (Slack/Teams) when thresholds are met.

Details:
- lib/telemetry/alertDedupe.ts: small in-memory dedupe and counting store (windowed) used to limit alert spam; now supports optional Redis backing (flagged by TELEMETRY_REDIS_ENABLED).
- app/api/telemetry/alert/route.ts: validates payload, records event counts, and forwards a compact Slack-friendly message to configured webhooks when criteria are met (critical severity always forwards; non-critical forwards when threshold reached).
- lib/telemetry/reportRendererImportFailure.ts posts to /api/telemetry/alert with severity (default warning) so server decides whether to escalate.
- Unit tests added for dedupe logic and the telemetry helper; integration-style tests mock webhook forwarding.

Why:
- Enables quick alerting for import failures without leaking secrets to clients and with simple anti-spam protections.

Thresholds & future work:
- Default threshold is 3 events/min (configurable via TELEMETRY_ALERT_THRESHOLD). Future work: richer aggregation, Redis backing for cross-worker consistency, and per-team routing.

Testing:
- Unit tests included for dedupe and telemetry helper; manual testing recommended with a real webhook configured in a staging env.

---

### Rollout & Testing playbook (operational)
**Goal:** enable safe rollout of Redis-backed dedupe and severity-based webhooks with minimal operational risk.

1) Defaults (safe):
   - TELEMETRY_REDIS_ENABLED=false (default) — system uses in-memory store (no infra dependency).
   - TELEMETRY_REDIS_URL= (left unset)
   - TELEMETRY_ALERT_WEBHOOK_DEFAULT= (unset)
   - TELEMETRY_ALERT_WEBHOOK_CRITICAL= (unset)
   - TELEMETRY_ALERT_THRESHOLD=3 (default)

2) Local developer test (quick smoke):
   - Start app: `npm run dev`
   - Trigger alert via HTTP (simulates client alert):
     `curl -s -X POST -H "Content-Type: application/json" -d '{"event":"renderer-import-failure","message":"smoke","buildSha":"local"}' http://localhost:3000/api/telemetry/alert`
   - Expectation: response `{ forwarded: false }` (no webhook configured) and `count` increments.
   - Or exercise full path via UI: open `/visual-layers/demo?forceImportFail=true` and use Playwright route to stub `/api/telemetry/alert` or a local webhook endpoint (RequestBin).

3) Staging rollout (enable Redis & webhook):
   - Configure staging env vars: `TELEMETRY_REDIS_URL=redis://...`, `TELEMETRY_REDIS_ENABLED=true`, `TELEMETRY_ALERT_WEBHOOK_DEFAULT=https://hooks.slack.com/..., TELEMETRY_ALERT_WEBHOOK_CRITICAL=...`, optionally set `TELEMETRY_ALERT_THRESHOLD=5` (more conservative).
   - Validate: send several test alert POSTs and verify: (a) the route returns `{ forwarded: true }` once threshold met, (b) the webhook receives a Slack-formatted message.
   - Monitor for noise and adjust `TELEMETRY_ALERT_THRESHOLD` or window if necessary.

4) Production rollout: after staging stability, enable on prod and monitor for incoming alerts; if noisy or problematic, revert quickly by setting `TELEMETRY_REDIS_ENABLED=false` or unsetting webhooks.

5) Notes & rollback:
   - Critical severity always forwards regardless of threshold (use sparingly).
   - To disable alerts immediately: unset `TELEMETRY_ALERT_WEBHOOK_DEFAULT`/`_CRITICAL` or set `TELEMETRY_REDIS_ENABLED=false` to revert to in-memory behavior.

6) Verification commands / tests:
   - Unit tests: `npx vitest run tests/unit/alertDedupe.test.ts tests/unit/alertRoute.test.ts`
   - E2E tests: `npx playwright test tests/e2e/visual-layers-import-failure.spec.ts` (exercise full path)

---

**Operational note:** Keep PR #20 as draft (as requested). After PR #16 merges and CI is quiet, mark this PR ready and proceed with staging activation and verification. If you want, I can also add a short `scripts/telemetry-test.sh` helper that posts a few payloads to exercise aggregation in staging.