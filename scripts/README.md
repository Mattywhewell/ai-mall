# Scripts Overview

This file describes the purpose and basic usage for the project's utility scripts.

- `scripts/introspect-local.sh` / `scripts/introspect-local.ps1`
  - Convenience wrapper to run local introspection (dbconnect + introspect), package logs, and print artifact path.
  - Usage: `./scripts/introspect-local.sh` (loads `.env.local` automatically if present).

- `scripts/run-introspect-and-upload.sh` / `scripts/run-introspect-and-upload.ps1`
  - Runs introspection and optionally uploads the zip to a GitHub release or gist if `GH_REPO` and `GITHUB_TOKEN` are set.
  - Usage: `GH_REPO=owner/repo GITHUB_TOKEN=... ./scripts/run-introspect-and-upload.sh`

- `scripts/run-introspect-vm.sh`
  - One-shot VM bootstrap script: installs Node/GH, clones repo, writes `.env.local` from arguments, runs introspection, parses outputs, and optionally creates a GitHub release.
  - Usage (example):
    `./scripts/run-introspect-vm.sh '<SUPABASE_DATABASE_URL>' 'https://project.supabase.co' '<SUPABASE_SERVICE_ROLE_KEY>'`.

- `scripts/ci-supabase-dbconnect.js`
  - Small diagnostic that attempts an SSL-enabled Postgres connection to `SUPABASE_DATABASE_URL` and prints errors for debugging CI connectivity issues.

- `scripts/ci-supabase-introspect.js`
  - Runs the introspection SQL queries via `exec_sql` RPC with an optional direct-PG fallback when `SUPABASE_DATABASE_URL` is available.

- `scripts/parse-introspection.js`
  - Parses `supabase-introspect.log` and emits `introspection-findings.json`, `introspection-findings.md`, and `introspection-patches.sql` (skeletons). Usage: `node scripts/parse-introspection.js <path-to-introspect-dir-or-zip>`.

- `scripts/local-create-user.js`
  - Diagnostic helper to exercise admin.createUser locally for verifying admin API behavior.

Notes & tips
- Always keep secrets (e.g., `SUPABASE_DATABASE_URL`, service role key) out of commits; use `.env.local` or export them as environment variables.
- Use `make help` for a quick list of commands in the repo.
