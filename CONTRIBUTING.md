# Contributing

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