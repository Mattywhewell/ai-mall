-- Audit logs for credential and sync events

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor TEXT,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_addr TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_seller ON audit_logs(seller_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
