-- API Key Management System
-- For managing external service integrations (AI services, payment providers, etc.)

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  key_prefix VARCHAR(10) NOT NULL, -- First 10 chars for identification
  service_type VARCHAR(50) NOT NULL, -- 'openai', 'stripe', 'webhook', etc.
  permissions TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Key Usage Logs
CREATE TABLE IF NOT EXISTS api_key_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(500),
  method VARCHAR(10),
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_service_type ON api_keys(service_type);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_key_logs_api_key_id ON api_key_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_logs_created_at ON api_key_logs(created_at);

-- Functions for API key management
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..32 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION hash_api_key(api_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(api_key, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_api_key(key_prefix TEXT, key_hash TEXT)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  service_type VARCHAR(50),
  permissions TEXT[],
  is_active BOOLEAN,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ak.id,
    ak.name,
    ak.service_type,
    ak.permissions,
    ak.is_active,
    ak.expires_at
  FROM api_keys ak
  WHERE ak.key_prefix = validate_api_key.key_prefix
    AND ak.key_hash = validate_api_key.key_hash
    AND ak.is_active = true
    AND (ak.expires_at IS NULL OR ak.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log API key usage
CREATE OR REPLACE FUNCTION log_api_key_usage(
  p_api_key_id UUID,
  p_endpoint TEXT,
  p_method TEXT,
  p_status_code INTEGER,
  p_response_time_ms INTEGER,
  p_ip_address INET,
  p_user_agent TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO api_key_logs (
    api_key_id,
    endpoint,
    method,
    status_code,
    response_time_ms,
    ip_address,
    user_agent
  ) VALUES (
    p_api_key_id,
    p_endpoint,
    p_method,
    p_status_code,
    p_response_time_ms,
    p_ip_address,
    p_user_agent
  );

  -- Update usage count
  UPDATE api_keys
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW(),
    updated_at = NOW()
  WHERE id = p_api_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can manage API keys
CREATE POLICY "Admins can manage API keys" ON api_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- API key logs are only visible to admins
CREATE POLICY "Admins can view API key logs" ON api_key_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );