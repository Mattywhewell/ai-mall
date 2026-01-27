# Contributing

Where to start: See `QUICK_START.md` for a short setup and `docs/INTROSPECTION.md` for DB introspection & patching guidance.

Thanks for contributing to Aiverse! This document covers quick guidelines for contributing, running tests, and validating CI notifications.

## Telemetry Notification Test (CI)
You can run a one-off test to verify Slack and email notifications for nightly telemetry failures.

- Run from GitHub UI: Repository → **Actions** → **Telemetry Notification Test** → **Run workflow**.
- Inputs (optional):
  - `notify_slack`: `true` or `false` (default: `true`)
  - `notify_email`: `true` or `false` (default: `true`)
  - `message`: Custom text for Slack and email body
  - `subject`: Email subject

### Required Secrets (set in Settings → Secrets & variables → Actions)
- Slack (optional): `SLACK_WEBHOOK` — Incoming Webhook URL for Slack.
- Email (optional): `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `NOTIFY_EMAIL`.

> The workflow will skip targets that aren't configured and print a short status message in the run logs.

## Running Tests Locally
- Unit tests: `npm test` (or `npm run test`)
- Playwright e2e: `npx playwright test` (ensure Playwright browsers are installed via `npx playwright install`)

**How to run the sequencer locally**

- Run the sequencer demo against a sample findings JSON:
  ```bash
  python scripts/sequencer_runner.py --input scripts/samples/normal-findings.json
  ```
- Run the sequencer tests:
  ```bash
  python -m pytest -q scripts/tests
  ```

Contributing micro‑guide (quick ritual)

A short checklist to keep contributions focused and the CI signal clean:

- Opening a PR: create a focused branch, run `npm run dev:check` and the sequencer tests if relevant, push the branch, open a PR against `main` with a concise description and any linked issues.
- CI behavior: unit tests and Python tests run on PRs; the Supabase integration job is currently disabled (see PR #49) and the `CI heartbeat` issue (#51) summarizes runs.
- Interpreting the heartbeat: check issue #51 for pulses — `All green` (good), `Noise detected` (known external noise), `New failure` (action required).
- What a clean signal means: all required workflows pass and there are no noisy failing jobs; this is the state we seek before merging.
- Philosophy: prefer small, reversible PRs, include tests or a short validation note, and re-run the sequencer or validations after making changes that touch introspection or the parser.

## CI Maintainers Checklist — E2E Precheck (quick ritual) ✅

If telemetry or nightly E2E fails, follow this three‑step ritual:

1. Dispatch the precheck
   - In the GitHub UI: Repository → **Actions** → **Manual E2E Precheck** → **Run workflow**
   - Or from CLI: `gh workflow run manual-e2e-precheck.yml --ref main`
   - Quick one-liner: `gh workflow run manual-e2e-precheck.yml`

2. Download the artifact
   - After the run completes, download the `e2e-precheck` artifact and open `precheck.txt`.

3. Interpret results
   - Healthy (what you want to see):
     - `NEXT_PUBLIC_SUPABASE_URL: present`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY: present`
     - `SUPABASE_SERVICE_ROLE_KEY: present`
     - `Table 'microstores' accessible` (and similar for `products`, `user_roles`)
     - `Supabase pre-check passed.`
   - Failing: missing `present` or an inaccessible table means either a missing secret (add `SUPABASE_SERVICE_ROLE_KEY` or the anon key in repo Settings → Secrets), or DB connectivity/schema issues (run migrations or verify Supabase network access).

If the precheck passes but Playwright still times out, download the `telemetry-playwright-report` artifact and Playwright trace and attach them to a new issue with the `ci` label — they provide the diagnostic traces we need.

(Keep this ritual short and high‑signal: it should take ~1–2 minutes to dispatch and obtain a clear answer.)

## DB Patch Workflow (Introspection → Patch → Validate)

This project follows a lightweight, repeatable workflow for DB changes discovered via introspection:

1. Run introspection locally or on a reachable VM using `./scripts/introspect-local.sh` (see `docs/INTROSPECTION.md`).
2. Upload the produced zip as a GitHub Release (or place it at a reachable URL) and open an issue using the **Supabase Introspection Artifact Attached** template.
3. Trigger automated parsing by commenting `/introspect <url>` on the issue, or run `node scripts/parse-introspection.js` locally to generate findings.
4. From the findings, prepare idempotent SQL patches (use `DO $$ BEGIN IF NOT EXISTS(...) THEN ... END IF; END $$;` patterns where possible) and include a short test that validates the change in staging.
5. Open a PR with the SQL migration(s), reference the issue, and include rollback steps and a short validation checklist.
6. After merging, re-run introspection and the admin createUser diagnostic to confirm the issue is resolved.

This keeps DB changes surgical, reviewed, and testable.
## Reporting Issues
- Open an issue with a clear title, steps to reproduce, and expected vs actual behavior.
- For security issues, please email `security@alverse.app` directly.

Thanks again — contributions and feedback are welcome!

## DB Patch Workflow (Introspection → Patch → Validate)

This project follows a lightweight, repeatable workflow for DB changes discovered via introspection:

1. Run introspection locally or on a reachable VM using `./scripts/introspect-local.sh` (see `docs/INTROSPECTION.md`).
2. Upload the produced zip as a GitHub Release (or place it at a reachable URL) and open an issue using the **Supabase Introspection Artifact Attached** template.
3. Trigger automated parsing by commenting `/introspect <url>` on the issue, or run `node scripts/parse-introspection.js` locally to generate findings.
4. From the findings, prepare idempotent SQL patches (use `DO $$ BEGIN IF NOT EXISTS(...) THEN ... END IF; END $$;` patterns where possible) and include a short test that validates the change in staging.
5. Open a PR with the SQL migration(s), reference the issue, and include rollback steps and a short validation checklist.
6. After merging, re-run introspection and the admin createUser diagnostic to confirm the issue is resolved.

This keeps DB changes surgical, reviewed, and testable.