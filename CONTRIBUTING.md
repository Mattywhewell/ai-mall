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