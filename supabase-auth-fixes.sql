-- Ensures the RBAC enum type exists in both public and auth schemas
-- and ensures a public.user_roles table exists (idempotent).

DO $$
BEGIN
  -- Create enum in auth schema if missing (helps GoTrue/admin sessions that use auth schema search_path)
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'user_role' AND n.nspname = 'auth'
  ) THEN
    CREATE TYPE auth.user_role AS ENUM ('admin','supplier','customer','ai_agent');
  END IF;
END $$;

DO $$
BEGIN
  -- Ensure public enum exists too (safe to re-run)
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'user_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.user_role AS ENUM ('admin','supplier','customer','ai_agent');
  END IF;
END $$;

-- Ensure the user_roles table exists in public schema
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'customer',
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);
