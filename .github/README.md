# CI Diagnostics (Quick Reference)

This short note documents the lightweight CI diagnostics workflows to help maintainers debug nightly E2E failures quickly.

## manual-e2e-precheck ✅

What it is:
- A tiny, dispatchable GitHub Actions workflow (`.github/workflows/manual-e2e-precheck.yml`) that runs only the Supabase E2E pre-check and uploads a `precheck.txt` artifact.

When to use it:
- Run this manually when CI telemetry tests fail or you suspect Supabase secrets/availability issues. It gives instant visibility without running the full telemetry job or Playwright browsers.

Where to find the output:
- After the job completes, download the `e2e-precheck` artifact from the workflow run (artifact contains `precheck.txt`).
- `precheck.txt` includes a short presence summary for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`, plus the `scripts/e2e-precheck.js` output (table access checks).

Failure behavior:
- The precheck is strict: missing keys or inaccessible tables cause the job to fail loudly (non-zero exit), so failures are deterministic and visible in the Actions UI and artifacts.

Notes:
- There used to be a temporary `manual-telemetry-run.yml` for full E2E debugging; it has been removed now that the precheck is stable and we verified the full flow.
- Use `manual-e2e-precheck` as the first diagnostic step — it’s fast, hermetic, and high signal.
