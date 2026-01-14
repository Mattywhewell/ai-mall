# CI triage: run 20997080966 — tests/e2e/user-journeys

Summary
- Test: `tests/e2e/user-journeys.spec.ts` (file-level timeout bumped to 60s in this run).
- Outcome: Test failed due to timeouts waiting for district elements on `/city` (locator.waitFor timed out) and fallback navigation then found no product content on `/districts/commerce` (marked flaky).

Key findings
- Timeouts
  - `locator.waitFor` for heading on `/city` timed out (15s wait).
  - `locator.waitFor` for `a[href^="/districts"]` on `/city` timed out (20s wait).
  - See `user-journeys.test.trace` for the full trace excerpt (added below).

- Network evidence
  - Many RSC (Next.js server components / Router prefetch/segment prefetch) requests aborted with `_failureText: "net::ERR_ABORTED"` during navigation and prefetch steps (examples: `/commons?_rsc`, `/city?_rsc`, `/collections?_rsc`).
  - These aborted segment/prefetch requests likely correlate with partial client-side hydration or missing DOM that the test expects.
  - See `user-journeys.0-trace.network` for a network excerpt.

Reproduction artifacts (added to the branch)
- `.github/triage/run-20997080966/user-journeys.test.trace` — Playwright test trace (excerpt and references)
- `.github/triage/run-20997080966/user-journeys.0-trace.network` — Network excerpt showing many aborted RSC prefetch calls

Immediate next steps (suggested)
1. Re-run CI to confirm this is deterministic; collect next trace if it recurs.
2. Investigate why RSC prefetch requests are being aborted in CI (server-side logs, inspect whether the app is OOM'ing or closing connections during navigation). Check recent server changes that affect RSC prefetch behavior.
3. Consider increasing locator timeouts or introducing a short retry/backoff for the district selectors (already implemented as part of hardening; may need to be more tolerant or rely on a server-side SSR marker).
4. If RSC aborts persist, consider adding a server-side sync marker (already added: `TestUserSSR`) to make test-user state deterministic or add guards that detect aborted RSC responses and retry navigation.

Notes
- The full Playwright trace.zip and per-test resources are available from the CI run artifacts (Playwright job uploads them on failure). If you want, I can attach full trace.zip to the PR or add more excerpts.

---
Automated triage created and committed to branch `e2e/wander-district-fix`.
