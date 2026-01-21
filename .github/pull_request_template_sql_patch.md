<!-- SQL Patch PR Template
Use this template for PRs that contain idempotent SQL patches derived from introspection findings.
Do NOT execute migrations in this PR description — include SQL in fenced code blocks. Keep each PR single-purpose and small.
-->

# chore(sql-migrations): <short-area> — <brief description>

## Summary
One-sentence summary of the change and the problem it fixes.

## Context / Artifact
- Introspection artifact: <link to artifact or gist>
- Findings file(s): `introspection-findings.json` / `<file>`

## Findings
- Bullet list of findings this PR addresses (object, schema, line example, why it matters).

## Change type
- Choose one: **Additive** | **Corrective** | **Destructive**
- Short justification for the chosen classification and any scheduling considerations.

## Proposed SQL patch (idempotent)
Include the final SQL to be run. Wrap with idempotency guards and clear comments.

```sql
-- Example: ensure enum exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'user_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.user_role AS ENUM ('admin','supplier','customer','ai_agent');
  END IF;
END $$;
```

## Idempotency guarantees
- Explain why this SQL is safe to re-run (IF NOT EXISTS, ALTER ... IF EXISTS, wrapped checks, advisory locks if used).
- Note edge cases and race conditions; document if an advisory lock is used for multi-step operations.

## Testing plan
- Local (recommended): commands to run locally (example: run against disposable DB, `psql -f migrations/xxxx.sql` then `SELECT ...` to verify).
- Staging: list integration tests / checks to run after applying migration.
- Re-introspection: steps to re-run parser and validate that the finding is resolved.

## Migration safety notes
- Downtime required: none / minimal / maintenance window required
- Locking characteristics: (e.g., `ALTER TABLE ... ADD COLUMN` is short; large `ALTER` may require planning)
- Data-loss risk: none / low / medium / high (and mitigation steps)

## Rollback plan
- Explicit steps to revert the migration, or an explanation why rollback is not possible and how to mitigate.
- Example: backup tables, restore process, or reversible SQL snippet.

## Checklist (developer)
- [ ] SQL is idempotent and scoped to a single purpose
- [ ] Local tests completed and documented in PR
- [ ] Staging apply instructions included and tested
- [ ] Re-introspection demonstrates finding resolved (attach output)
- [ ] Migration file added under `/migrations/` with timestamp & descriptive name

## Checklist (reviewer)
- [ ] Confirm finding exists in artifact and is addressed by the SQL
- [ ] Validate idempotency logic and potential races
- [ ] Confirm migration is minimally scoped and non-destructive (unless documented)
- [ ] Confirm testing plan is adequate (local, staging, re-introspection)
- [ ] Confirm rollback plan is clear

## Post-merge steps
- Re-run introspection & parser; attach results to this PR/issue
- Run smoke tests / relevant integration tests
- Monitor application logs and metrics for 24–72 hours

## Notes / Follow-ups
- Any follow-up tasks (e.g., update policies, add indexes, run vacuum/analyze)

<!-- End of template -->