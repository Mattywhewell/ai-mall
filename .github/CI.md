E2E CI env note

Purpose
------
This project exposes several test-only API endpoints (under `/api/test/*`) which are gated to prevent accidental exposure in production. These endpoints are used by the Playwright E2E harness to deterministically set and clear a server-side `test_user` SSR marker.

Required CI environment
----------------------
To enable test-only endpoints during E2E runs, ensure one of the following is true for CI jobs that build and run the app/server:

- NEXT_PUBLIC_INCLUDE_TEST_PAGES=true
- OR the runtime process receives CI=true *and* your build/runtime configuration picks up CI at runtime (this is less deterministic across different CI setups)

Recommendation
-------------
Set `NEXT_PUBLIC_INCLUDE_TEST_PAGES=true` explicitly in any GitHub Actions job that builds and/or starts the Next.js server for Playwright E2E (see `.github/workflows/playwright.yml` and `.github/workflows/playwright-e2e-only.yml`). This guarantees the `/api/test/*` endpoints (including `/api/test/clear-test-user`) are available at runtime and that server SSR logic can be toggled for deterministic tests.

Notes
-----
- This flag is intentionally gated and should never be set in production. Keep it confined to CI and local E2E debug runs only.
- Do NOT export or inline `NEXT_PUBLIC_TEST_USER` at build time or during server start. Tests should use the runtime test endpoints (e.g., `/api/test/set-test-user`) or set `test_user` cookies at runtime so server-side clearing can take effect. If `SKIP_SUPABASE_SEED=true`, prefer leaving `NEXT_PUBLIC_TEST_USER` empty to avoid deterministic inlining.
- If you run E2E in multiple workflows, ensure the flag is set in all those workflows (e.g., `e2e-sigv4.yml` and any other Playwright job that starts the server).```