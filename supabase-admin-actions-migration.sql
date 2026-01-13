-- NOTE: This file was moved into the supabase migrations pipeline: `supabase/migrations/20260112_add_admin_actions.sql`
-- Keep this here for reference. Apply migrations from the `supabase/migrations` folder instead.

-- Migration: create admin_actions table for audit logs
CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_user_id ON admin_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at);

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Policy: allow service role inserts (for server-side logging) and allow admins to view
CREATE POLICY "Service role can insert admin actions" ON admin_actions
  FOR INSERT
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: public can read (optional; narrow if needed)
CREATE POLICY "Public can read admin actions (narrow)" ON admin_actions
  FOR SELECT
  USING (true);

-- Note: Adjust policies to your security posture when applying to production.
