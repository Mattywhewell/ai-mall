E2E setup & seeding (Playwright)

Purpose
- Provide an idempotent script to seed minimal test data required by Playwright CI (ensures deterministic rows such as product `P1`).

Files added
- `scripts/e2e-setup.js` — idempotent seeding script that uses the Supabase service role key.
- `package.json` — added script `e2e:setup` (runs `node scripts/e2e-setup.js`).
- `.github/workflows/playwright.yml` — calls `npm run e2e:setup` before starting the production server in CI.

Required environment (CI)
- Set these as GitHub repository secrets in your CI environment:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (service_role key, **must be secret**)

How it behaves
- In CI the `scripts/e2e-precheck.js` will run first and fail the job early with a clear, actionable message if required Supabase credentials or schema are missing (fast fail).
- Next the `scripts/e2e-setup.js` will run to seed minimal deterministic records (microstore `e2e-supplier`, product `P1`, optional price row).
- Locally, if Supabase is not configured or placeholder values are detected, the setup script skips seeding to avoid noisy failures for developers.

How to run locally
- Add Supabase credentials to `.env.local` (or export env vars), then:
  - npm run e2e:setup

Notes & next steps
- The script is intentionally minimal and idempotent (creates/ensures `microstore 'e2e-supplier'` and product `P1`). If you want additional seeded state, extend `scripts/e2e-setup.js`.
- CI will now run the seeding phase before starting the production server for Playwright tests — after you add the repository secrets, run the Playwright CI job to observe the effect on failing tests and we can iterate to tighten flakiness further.
