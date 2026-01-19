-- Idempotent migration: enable RLS on public.agent_communications and add restrictive policies

DO $$
BEGIN
  -- Only proceed if the table exists
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = 'agent_communications' AND n.nspname = 'public'
  ) THEN

    -- Enable row level security if not already enabled
    IF NOT (
      SELECT c.relrowsecurity FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE c.relname = 'agent_communications' AND n.nspname = 'public'
    ) THEN
      EXECUTE 'ALTER TABLE public.agent_communications ENABLE ROW LEVEL SECURITY';
    END IF;

    -- Helper to ensure a named policy exists
    PERFORM 1;

    -- SELECT policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policy p
      JOIN pg_class c ON p.polrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE c.relname = 'agent_communications' AND n.nspname = 'public' AND p.polname = 'select_own'
    ) THEN
      EXECUTE $$
        CREATE POLICY select_own ON public.agent_communications
        FOR SELECT USING (user_id = auth.uid());
      $$;
    END IF;

    -- INSERT policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policy p
      JOIN pg_class c ON p.polrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE c.relname = 'agent_communications' AND n.nspname = 'public' AND p.polname = 'insert_own'
    ) THEN
      EXECUTE $$
        CREATE POLICY insert_own ON public.agent_communications
        FOR INSERT WITH CHECK (user_id = auth.uid());
      $$;
    END IF;

    -- UPDATE policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policy p
      JOIN pg_class c ON p.polrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE c.relname = 'agent_communications' AND n.nspname = 'public' AND p.polname = 'update_own'
    ) THEN
      EXECUTE $$
        CREATE POLICY update_own ON public.agent_communications
        FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
      $$;
    END IF;

    -- DELETE policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policy p
      JOIN pg_class c ON p.polrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE c.relname = 'agent_communications' AND n.nspname = 'public' AND p.polname = 'delete_own'
    ) THEN
      EXECUTE $$
        CREATE POLICY delete_own ON public.agent_communications
        FOR DELETE USING (user_id = auth.uid());
      $$;
    END IF;

    -- Admin full access policy (based on jwt role claim)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policy p
      JOIN pg_class c ON p.polrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE c.relname = 'agent_communications' AND n.nspname = 'public' AND p.polname = 'admin_full_access'
    ) THEN
      EXECUTE $$
        CREATE POLICY admin_full_access ON public.agent_communications
        FOR ALL USING (current_setting('jwt.claims.role', true) = 'admin');
      $$;
    END IF;

  END IF;
END $$;
