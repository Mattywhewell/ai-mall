-- rls-fix-top5.sql
-- Purpose: Enable RLS and add conservative starter policies for the 5 highest-risk tables
-- Top-5: enterprise_api_keys, conversation_messages, conversation_sessions, user_profiles, orders
-- Safety: this file backs up existing policy rows into schema "migrations_backup" before applying changes.
-- Usage (psql):
--   $env:PGPASSWORD="<pw>"
--   psql -h <HOST> -p <PORT> -U <USER> -d <DB> -f migrations/rls-fix-top5.sql
-- Dry-run (validate SQL only, no commit): paste the body inside BEGIN; ... ROLLBACK;

BEGIN;

-- 1) Create a lightweight backup of existing policies for the affected tables.
CREATE SCHEMA IF NOT EXISTS migrations_backup;

DROP TABLE IF EXISTS migrations_backup.policies_backup;
CREATE TABLE migrations_backup.policies_backup AS
  SELECT tablename, policyname, qual::text AS qual, COALESCE(with_check::text,'') AS with_check
  FROM pg_policies
  WHERE tablename IN (
    'enterprise_api_keys', 'conversation_messages', 'conversation_sessions', 'user_profiles', 'orders'
  );

-- Also create a convenience table with recreated SQL statements (best-effort)
DROP TABLE IF EXISTS migrations_backup.policies_recreate_sql;
CREATE TABLE migrations_backup.policies_recreate_sql AS
SELECT
  tablename,
  policyname,
  'DROP POLICY IF EXISTS "' || policyname || '" ON ' || tablename || ';\nCREATE POLICY "' || policyname || '" ON ' || tablename || ' FOR ALL USING (' || COALESCE(qual::text,'TRUE') || ') WITH CHECK (' || COALESCE(with_check::text,'TRUE') || ');' AS recreate_sql
FROM pg_policies
WHERE tablename IN (
  'enterprise_api_keys', 'conversation_messages', 'conversation_sessions', 'user_profiles', 'orders'
);

-- Export helper (psql friendly):
-- COPY (SELECT * FROM migrations_backup.policies_backup) TO STDOUT WITH CSV HEADER;
-- COPY (SELECT recreate_sql FROM migrations_backup.policies_recreate_sql) TO STDOUT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='enterprise_api_keys') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='enterprise_api_keys' AND column_name='api_key') THEN
      -- Enable RLS and revoke public select when the table exists and has api_key
      ALTER TABLE public.enterprise_api_keys ENABLE ROW LEVEL SECURITY;
      REVOKE SELECT ON public.enterprise_api_keys FROM public;

      EXECUTE $$
        DROP POLICY IF EXISTS "Service read enterprise api keys" ON public.enterprise_api_keys;
        CREATE POLICY "Service read enterprise api keys" ON public.enterprise_api_keys
          FOR SELECT USING (
            auth.role() = 'service_role' OR auth.role() = 'admin'
          );

        DROP POLICY IF EXISTS "Service manage enterprise api keys" ON public.enterprise_api_keys;
        CREATE POLICY "Service manage enterprise api keys" ON public.enterprise_api_keys
          FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'admin');
      $$;
    ELSE
      RAISE NOTICE 'Skipping enterprise_api_keys policies: column api_key not found';
    END IF;
  ELSE
    RAISE NOTICE 'Skipping enterprise_api_keys: table not found';
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='conversation_messages') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversation_messages' AND column_name='session_id') THEN
      -- Enable RLS and revoke public select when session_id exists
      ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
      REVOKE SELECT ON public.conversation_messages FROM public;

      EXECUTE $$
        DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.conversation_messages;
        CREATE POLICY "Users can view messages in their conversations" ON public.conversation_messages
          FOR SELECT USING (
            session_id IN (SELECT session_id FROM public.conversation_sessions WHERE user_id = auth.uid()::uuid)
            OR auth.role() IN ('service_role','admin')
          );

        DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.conversation_messages;
        CREATE POLICY "Users can insert messages in their conversations" ON public.conversation_messages
          FOR INSERT WITH CHECK (
            session_id IN (SELECT session_id FROM public.conversation_sessions WHERE user_id = auth.uid()::uuid)
            OR session_id IS NULL OR auth.role() IN ('service_role','admin')
          );

        DROP POLICY IF EXISTS "System can manage conversation messages" ON public.conversation_messages;
        CREATE POLICY "System can manage conversation messages" ON public.conversation_messages
          FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'admin');
      $$;
    ELSE
      RAISE NOTICE 'Skipping conversation_messages policies: session_id column not found';
    END IF;
  ELSE
    RAISE NOTICE 'Skipping conversation_messages: table not found';
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='conversation_sessions') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversation_sessions' AND column_name='user_id') THEN
      ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;
      REVOKE SELECT ON public.conversation_sessions FROM public;

      EXECUTE $$
        DROP POLICY IF EXISTS "Users can view own sessions" ON public.conversation_sessions;
        CREATE POLICY "Users can view own sessions" ON public.conversation_sessions
          FOR SELECT USING (
            user_id = auth.uid()::uuid
          );

        DROP POLICY IF EXISTS "Users can insert own sessions" ON public.conversation_sessions;
        CREATE POLICY "Users can insert own sessions" ON public.conversation_sessions
          FOR INSERT WITH CHECK (
            user_id = auth.uid()::uuid OR user_id IS NULL
          );

        DROP POLICY IF EXISTS "System can manage sessions" ON public.conversation_sessions;
        CREATE POLICY "System can manage sessions" ON public.conversation_sessions
          FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'admin');
      $$;
    ELSE
      RAISE NOTICE 'Skipping conversation_sessions policies: user_id column not found';
    END IF;
  ELSE
    RAISE NOTICE 'Skipping conversation_sessions: table not found';
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_profiles') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='user_id') THEN
      ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
      REVOKE SELECT ON public.user_profiles FROM public;

      EXECUTE $$
        DROP POLICY IF EXISTS "Users can manage own profile" ON public.user_profiles;
        CREATE POLICY "Users can manage own profile" ON public.user_profiles
          FOR ALL USING (user_id = auth.uid()::uuid);
      $$;
    ELSE
      RAISE NOTICE 'Skipping user_profiles policies: user_id column not found';
    END IF;
  ELSE
    RAISE NOTICE 'Skipping user_profiles: table not found';
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='orders') THEN
    -- Enable RLS and add conservative policies; orders table does not contain user_id in this schema
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

    EXECUTE $$
      DROP POLICY IF EXISTS "Admin full access to orders" ON public.orders;
      CREATE POLICY "Admin full access to orders" ON public.orders
        FOR ALL USING (auth.role() = 'admin' OR auth.role() = 'service_role');

      DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
      CREATE POLICY "Users can create orders (authenticated)" ON public.orders
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');

      DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
      CREATE POLICY "Users can view own orders" ON public.orders
        FOR SELECT USING (auth.role() = 'admin' OR auth.role() = 'service_role');
    $$;
  ELSE
    RAISE NOTICE 'Skipping orders policies: table not found';
  END IF;
END$$;

-- Verification and diagnostics
-- Show any policies for these tables that still reference auth.uid() without ::uuid (should be none)
SELECT tablename, policyname, qual, with_check
FROM pg_policies
WHERE tablename IN ('enterprise_api_keys','conversation_messages','conversation_sessions','user_profiles','orders')
  AND (
    (COALESCE(qual::text,'') ILIKE '%auth.uid()%' AND COALESCE(qual::text,'') NOT ILIKE '%auth.uid()%::uuid%')
    OR (COALESCE(with_check::text,'') ILIKE '%auth.uid()%' AND COALESCE(with_check::text,'') NOT ILIKE '%auth.uid()%::uuid%')
  );

COMMIT;

-- Restore snippet (if you used the migrations_backup tables):
-- You can recreate original policies by iterating migrations_backup.policies_recreate_sql; for example in psql:
--   COPY (SELECT recreate_sql FROM migrations_backup.policies_recreate_sql) TO 'policies_recreate.sql';
-- Then inspect and run the produced SQL: psql -f policies_recreate.sql

-- Quick psql export/restore commands if you prefer CSV-based backup:
-- Export current policy rows for the affected tables to CSV:
-- COPY (SELECT tablename, policyname, qual::text, "check"::text FROM pg_policies WHERE tablename IN ('enterprise_api_keys','conversation_messages','conversation_sessions','user_profiles','orders')) TO STDOUT WITH CSV HEADER > policies_backup.csv;
-- To restore: build SQL statements from the CSV (manual inspection required) or use the migrations_backup.policies_recreate_sql table above.
