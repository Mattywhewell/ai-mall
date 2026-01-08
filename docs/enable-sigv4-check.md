# Enabling SigV4 e2e check as a required status check

This project includes a GitHub Action workflow `E2E SigV4 checks` that runs an e2e smoke test verifying our SigV4 signer and adapter behavior.

To require this check before merging to `main` (branch protection), follow these steps:

1. Create a personal access token (PAT) with **repo (admin)** privileges. Store it in the repository secrets as `BRANCH_PROTECTION_TOKEN`.
2. Go to the Actions tab in GitHub, find the workflow `Enable SigV4 required status check`, and choose **Run workflow**. The workflow runs manually and accepts inputs:
   - `branch` (defaults to `main`)
   - `contexts` (comma-separated list of status check contexts, defaults to `E2E SigV4 checks`)

   It will configure branch protection for the selected branch to *require* the specified status contexts.
3. Verify branch protection in the repository **Settings → Branches → Branch protection rules** to confirm the required check is listed.

Notes:
- If your repository uses a different default branch name (e.g., `master`), edit `.github/workflows/set-branch-protection.yml` and change the `branch` variable accordingly before running the workflow.
- The name shown in the branch protection UI may reflect the workflow display name. If branch protection fails to find the check, inspect the checks on a PR to see the exact context name and add that name to `requiredContexts` in the workflow, then re-run.
- You can also manually set the required check via the GitHub Settings UI if you prefer not to use the PAT approach.
\n\n> PR test: trigger E2E SigV4 check (no-op) - created by automation
