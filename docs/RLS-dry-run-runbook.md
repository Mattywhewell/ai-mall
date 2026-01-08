# RLS Dry-Run Runbook

Purpose: Safely validate and schedule RLS (Row-Level Security) fixes in staging before applying to production.

Prerequisites
- Confirm staging DB connection string (STAGING_DB_URL) and that you have snapshot/backup capability.
- Verify Playwright and integration tests can run against a staging clone.
- Confirm a rollback plan and backup retention policy.

High-level steps
1. Create a staging DB snapshot (or point-in-time backup).
   - If using managed Postgres (e.g., Supabase), create a DB backup/snapshot from the console.
   - Alternatively, use pg_dump:
     ```bash
     pg_dump "$STAGING_DB_URL" --schema-only --file=pre_migration_schema.sql
     pg_dump --data-only --file=pre_migration_data.sql "$STAGING_DB_URL"
     ```
2. (Recommended) Clone the staging DB into a temporary test DB and run the dry-run there.
   - Restore snapshot into `staging_test_clone` and point your app/tests at it.
3. Dry-run the SQL migration (transactional with rollback):
   - Example (bash):
     ```bash
     (echo "BEGIN;"; cat migrations/rls-fix-top5.sql; echo "ROLLBACK;") | psql "$STAGING_DB_URL"
     ```
   - Or use the provided script `scripts/run-rls-dryrun.sh` which wraps the SQL in a transaction and prints output.
4. Inspect results and look for errors or policy conflicts.
   - Query `pg_policies` to validate policies changed as expected:
     ```sql
     SELECT * FROM pg_policies WHERE tablename = 'your_table';
     ```
   - Run representative application queries and integration tests against the test clone.
5. If dry-run is clean, schedule the real migration on staging with a maintenance window.
   - Take another fresh snapshot prior to running the real migration.
   - Apply migration and run smoke tests and a subset of Playwright tests.
6. If staging passes, prepare the production migration plan (phased deployment, backups, rollback steps).

Rollback plan
- If issues occur, restore staging from the snapshot taken before the migration.
- Document exact restore steps for the DBA or the automation runbook.

Safety checks & validation
- Run RLS-sensitive queries from non-privileged roles to confirm expected access.
- Add and run an integration test set that exercises the top-5 affected flows.

Timing & stakeholders
- Estimate: 30–60 minutes for staging dry-run (excluding backups and clone time).
- Notify: engineering team, on-call DB owner, QA, and product owner.

Post-run cleanup
- Remove any test DB clones and temporary endpoints.
- Update migration tracking docs and mark tasks complete.

Contact
- If you want, I can run the dry-run for you once you confirm backups/schedule and provide DB access or run the commands yourself and paste results here.
