-- Migration 2026-01-12: add admin_actions table for admin audit logs

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

-- Policy: allow inserts from service role / authenticated server actions
CREATE POLICY IF NOT EXISTS "Service role can insert admin actions" ON admin_actions
  FOR INSERT
  USING (true)
  WITH CHECK (true);

-- Policy: public read (narrow as needed)
CREATE POLICY IF NOT EXISTS "Public can read admin actions (narrow)" ON admin_actions
  FOR SELECT
  USING (true);

-- Note: Adjust these policies based on your security posture; consider restricting SELECT to admin roles in production.
