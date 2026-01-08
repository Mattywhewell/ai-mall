# Integration Tests (Supabase)

This document explains how to wire the integration tests into CI, what secrets they need, and how to run them locally or via GitHub Actions.

## Required repository secrets

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL (e.g. https://abc123.supabase.co)
- `SUPABASE_SERVICE_ROLE_KEY` — the *service_role* key for the project. This key is required for tests that insert test fixtures and run server-side operations.

> Note: Limit access to `SUPABASE_SERVICE_ROLE_KEY` to CI and trusted maintainers. If possible, create a dedicated Supabase test project with test-only data.

## GitHub Actions Workflow

A workflow file has been added at `.github/workflows/integration-tests.yml`. It runs on `workflow_dispatch` and on `pull_request` when changes touch `tests/integration/**`, `lib/**`, or `scripts/**`.

The workflow does the following:

1. Verifies the required secrets are present. The job will fail early if secrets are missing.
2. Installs Node dependencies and Playwright browsers.
3. Runs the integration tests (`npx playwright test tests/integration`) with a single worker to avoid inter-test DB interference.
4. Uploads the Playwright report as an artifact.

## How to add secrets

1. Go to your repository on GitHub → Settings → Secrets and variables → Actions.
2. Click "New repository secret".
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### Optional: Add a Branch Protection PAT

If you want GitHub to automatically require the integration job as a required status check, create a personal access token (PAT) and add it as a repository secret named `BRANCH_PROTECTION_TOKEN`.

- Recommended PAT scopes: `repo` (full control of private repositories) so the token can update branch protection rules. If you want more granular scope, ensure the token has permissions to update repository settings.
- Steps:
  1. Create a PAT at https://github.com/settings/tokens (give it a descriptive name like "branch-protection-bot").
  2. Add it to the repository Secrets as `BRANCH_PROTECTION_TOKEN`.

### Enable branch protection for the integration job

A helper workflow has been added: `.github/workflows/enable-integration-branch-protection.yml`. It is runnable manually via the Actions tab (Workflow: "Enable Integration Tests branch protection"). The workflow will configure the default branch (or a branch you specify) to require the status check named **Integration Tests (Supabase)**.

To run it manually:
1. Go to the repository → Actions → "Enable Integration Tests branch protection" → Run workflow.
2. Leave `branch` as `main` (or change to your default branch), then click "Run workflow".

> Once this runs successfully, new PRs will be required to pass the Integration Tests before merging (enforced for all users including admins).

## Run tests locally

You can run the tests locally with the secrets set in your environment (PowerShell):

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL = "https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
npm ci
npx playwright test tests/integration --workers=1
```

If you don't want to use an existing project, create a dedicated Supabase test project and configure the two secrets accordingly.

## Notes and tips

- The integration tests included here use mocked external adapters and the Supabase service role key to insert test data. They should be safe to run against a dedicated test project but **do not** run them against production data.
- If the integration tests are flaky due to DB state, run `--workers=1` or create per-test isolation fixtures.
