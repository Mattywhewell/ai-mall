# CI Stabilization: SigV4 & Test Runner Improvements (Jan 2026)

## Summary
This document records the stabilization work completed in Jan 2026 to make SigV4 E2E checks and unit test discovery deterministic, observable, and easier to audit. It captures the problem, root causes, the changes made, and links to CI evidence and artifacts.

## What changed
- Scoped Vitest discovery to unit tests to avoid cross-suite interference.
- Added a stable test script (`npm run test:stable`) to reduce flakiness in CI runs.
- Enhanced verifier observability:
  - Writes per-attempt NDJSON logs (`verifier-log.ndjson`) of polling attempts.
  - Produces a compact structured summary (`sigv4-summary-<sha>.json`) and uploads both as workflow artifacts.
- Fixed verifier runtime bugs (scoped variables, removed duplicate `require('fs')` by using a safe `globalThis._verifier_fs`).

## PRs
- chore/vitest-config-scope — PR #82 (Vitest scoping & lockfile update)
- chore/add-stable-test-script — PR #83 (stable test runner)
- chore/verifier-ndjson — PR #84 (NDJSON + summary + verifier fixes)

## Root causes
- Lockfile (package-lock.json) and `package.json` mismatch caused `npm ci` to fail on E2E runners (vitest version mismatch).
- Verifier JavaScript runtime issues: scoping bugs and duplicate `fs` declarations that led to ReferenceError / SyntaxError during workflow runs.

## Before / After CI state
- Before: intermittent E2E failures (sigv4-e2e checks not reliably detected), verifier scripts threw runtime errors and CI runs were non-deterministic.
- After: CI on `main` is green for the validation runs performed after the fixes (E2E SigV4, Playwright e2e, Pytest). Verifier artifacts are produced for auditability.

## Evidence & artifacts
- Example verifier summary (success): `artifacts/21377250520/sigv4-summary-aabc.../sigv4-summary-1d8fff58819c093054e99846b64d74ef17d0df44.json`
  - Example contents: `{ "outcome": "success", "attemptsUsed": 5, "timeToSuccessMs": 27697 }`
- Per-attempt logs: `artifacts/21377250520/.../verifier-log.ndjson` (~10 KB) — shows attempts 1→6 and final detection of `sigv4-e2e` success.
- Representative run IDs:
  - E2E SigV4: `21378031508` (success)
  - Playwright e2e: `21378031519` (46 passed) — artifact: `playwright-report-e2e`
  - Pytest: `21378031518` (success)

## Notes
- This is intentionally lightweight and focused—its goal is to preserve the stabilization arc and provide future engineers a breadcrumb trail.
- Suggestion: archive these artifacts in a release or add them to a designated `release-artifacts/` folder if long-term retention is required.

---

*Document authored by automation after the SigV4 stabilization work (Jan 2026).*
