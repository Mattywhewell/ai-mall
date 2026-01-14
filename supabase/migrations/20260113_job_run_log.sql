-- Job Run Log Migration
-- Creates a table to track scheduled job runs and their results

CREATE TABLE IF NOT EXISTS job_run_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL, -- running, completed, failed
  activated_count INTEGER DEFAULT 0,
  deactivated_count INTEGER DEFAULT 0,
  metadata JSONB, -- optional structured metadata (headers, env, etc)
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_run_log_job_name ON job_run_log(job_name);
CREATE INDEX IF NOT EXISTS idx_job_run_log_created_at ON job_run_log(created_at);

-- Grant permissions for admin role if using RLS
ALTER TABLE job_run_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert job run logs" ON job_run_log
  FOR INSERT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin')
    )
  );

CREATE POLICY "Public can read job run log (optional, narrow if needed)" ON job_run_log
  FOR SELECT USING (true);
