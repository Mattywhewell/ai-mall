# Supabase Migrations

This folder contains SQL migration files applied via the Supabase CLI (`supabase db push`) or through your deployment pipeline.

New migration added:

- `20260112_add_admin_actions.sql` — creates the `admin_actions` audit table and indexes. Run with `supabase db push` or include in your migration pipeline to apply.

How to apply:

1. If using Supabase CLI locally:
   - Install supabase CLI and run: `supabase db push` (ensure `SUPABASE_SERVICE_ROLE_KEY` is set in your environment)

2. If running via your deployment pipeline (CI/CD):
   - Ensure the pipeline runs `supabase db push` or otherwise applies the SQL files in `supabase/migrations`.

If you prefer, you can also run the migration with the local `setup-database.js` script by appending the SQL filename to the `sqlFiles` list in that script.
