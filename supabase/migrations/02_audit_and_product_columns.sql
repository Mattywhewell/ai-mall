-- 02_audit_and_product_columns.sql
-- Create or extend audit_logs table and ensure product/pending_product audit columns exist

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT,
  record_id UUID,
  action TEXT,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role user_role,
  changes JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure required audit_logs columns exist and are typed correctly
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'table_name') THEN
    ALTER TABLE audit_logs ADD COLUMN table_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'record_id') THEN
    ALTER TABLE audit_logs ADD COLUMN record_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'action') THEN
    ALTER TABLE audit_logs ADD COLUMN action TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'actor_id') THEN
    ALTER TABLE audit_logs ADD COLUMN actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'actor_role') THEN
    ALTER TABLE audit_logs ADD COLUMN actor_role user_role;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'changes') THEN
    ALTER TABLE audit_logs ADD COLUMN changes JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'metadata') THEN
    ALTER TABLE audit_logs ADD COLUMN metadata JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'created_at') THEN
    ALTER TABLE audit_logs ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create indexes for audit_logs only if the referenced columns exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'table_name')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'record_id') THEN
    CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'actor_id') THEN
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'action') THEN
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
  END IF;
END $$;

-- Add audit columns to products (idempotent)
ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS flag_reason TEXT,
  ADD COLUMN IF NOT EXISTS ai_modifications JSONB,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Add audit columns to pending_products only if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_products') THEN
    ALTER TABLE pending_products
      ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
      ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES auth.users(id),
      ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS flag_reason TEXT;
  END IF;
END $$;
