-- ============================================================================
-- Supplier Auto-Integration Schema
-- ============================================================================
-- Extends suppliers table and creates autonomous_jobs table for
-- automatic supplier integration into AI City
-- ============================================================================

-- Create suppliers table if it doesn't exist
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  category TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);

-- Extend suppliers table with integration fields
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS integration_status TEXT DEFAULT 'pending' CHECK (integration_status IN ('pending', 'in_progress', 'complete', 'failed'));
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS integrated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS integration_error TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS brand_voice TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS website TEXT; -- Supplier website URL
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS website_analysis JSONB DEFAULT '{}'; -- Website analysis data
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- CJdropshipping token management fields
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS cj_access_token TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS cj_access_token_expiry TIMESTAMP WITH TIME ZONE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS cj_refresh_token TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS cj_refresh_token_expiry TIMESTAMP WITH TIME ZONE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS cj_token_last_refresh TIMESTAMP WITH TIME ZONE;

-- Add supplier_id to products table if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;

CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);

-- Create autonomous_jobs table for background tasks
CREATE TABLE IF NOT EXISTS autonomous_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  job_type TEXT NOT NULL, -- 'seo_generation', 'social_content', 'description_optimization', etc.
  entity_id TEXT NOT NULL, -- Supplier ID or Product ID
  entity_type TEXT DEFAULT 'supplier', -- 'supplier', 'product', 'collection'
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  
  job_data JSONB DEFAULT '{}',
  result JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON autonomous_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON autonomous_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_entity ON autonomous_jobs(entity_id);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled ON autonomous_jobs(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_suppliers_integration ON suppliers(integration_status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_job_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_job_updated_at
  BEFORE UPDATE ON autonomous_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_job_timestamp();

-- Function to get next job for processing
CREATE OR REPLACE FUNCTION get_next_job(p_job_types TEXT[] DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  job_type TEXT,
  entity_id TEXT,
  job_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  UPDATE autonomous_jobs
  SET 
    status = 'in_progress',
    started_at = NOW(),
    updated_at = NOW()
  WHERE autonomous_jobs.id = (
    SELECT autonomous_jobs.id
    FROM autonomous_jobs
    WHERE status = 'pending'
      AND scheduled_for <= NOW()
      AND attempts < max_attempts
      AND (p_job_types IS NULL OR job_type = ANY(p_job_types))
    ORDER BY 
      CASE priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
      END,
      scheduled_for ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING 
    autonomous_jobs.id,
    autonomous_jobs.job_type,
    autonomous_jobs.entity_id,
    autonomous_jobs.job_data;
END;
$$ LANGUAGE plpgsql;

-- Function to mark job complete
CREATE OR REPLACE FUNCTION complete_job(
  p_job_id UUID,
  p_result JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE autonomous_jobs
  SET 
    status = 'completed',
    completed_at = NOW(),
    result = p_result,
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark job failed
CREATE OR REPLACE FUNCTION fail_job(
  p_job_id UUID,
  p_error TEXT,
  p_retry BOOLEAN DEFAULT TRUE
)
RETURNS VOID AS $$
DECLARE
  v_attempts INTEGER;
  v_max_attempts INTEGER;
BEGIN
  -- Increment attempts
  UPDATE autonomous_jobs
  SET 
    attempts = attempts + 1,
    last_error = p_error,
    updated_at = NOW()
  WHERE id = p_job_id
  RETURNING attempts, max_attempts INTO v_attempts, v_max_attempts;
  
  -- If max attempts reached or no retry, mark as failed
  IF v_attempts >= v_max_attempts OR NOT p_retry THEN
    UPDATE autonomous_jobs
    SET 
      status = 'failed',
      updated_at = NOW()
    WHERE id = p_job_id;
  ELSE
    -- Reset to pending for retry
    UPDATE autonomous_jobs
    SET 
      status = 'pending',
      scheduled_for = NOW() + INTERVAL '5 minutes' * v_attempts, -- Exponential backoff
      updated_at = NOW()
    WHERE id = p_job_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to trigger supplier integration
CREATE OR REPLACE FUNCTION trigger_supplier_integration()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-create integration job when supplier status changes to approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO autonomous_jobs (
      job_type,
      entity_id,
      entity_type,
      priority,
      job_data
    ) VALUES (
      'supplier_integration',
      NEW.id,
      'supplier',
      'high',
      jsonb_build_object(
        'business_name', NEW.business_name,
        'category', NEW.category,
        'triggered_at', NOW()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_integrate_supplier
  AFTER INSERT OR UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_supplier_integration();

-- Function to trigger product integration when added
CREATE OR REPLACE FUNCTION trigger_product_integration()
RETURNS TRIGGER AS $$
BEGIN
  -- When a product is added to an already-integrated supplier, trigger content generation
  IF NEW.active = TRUE THEN
    INSERT INTO autonomous_jobs (
      job_type,
      entity_id,
      entity_type,
      priority,
      job_data
    ) VALUES 
    (
      'product_content_generation',
      NEW.id,
      'product',
      'normal',
      jsonb_build_object(
        'supplier_id', NEW.supplier_id,
        'product_name', NEW.name,
        'category', NEW.category
      )
    ),
    (
      'product_placement',
      NEW.id,
      'product',
      'high',
      jsonb_build_object(
        'supplier_id', NEW.supplier_id,
        'product_name', NEW.name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_integrate_product
  AFTER INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION trigger_product_integration();

-- RLS Policies
ALTER TABLE autonomous_jobs ENABLE ROW LEVEL SECURITY;

-- Only admins and system can access jobs
CREATE POLICY "Admins can view all jobs" ON autonomous_jobs
  FOR SELECT USING (true); -- Adjust based on your auth setup

CREATE POLICY "System can manage jobs" ON autonomous_jobs
  FOR ALL USING (true); -- Adjust based on your auth setup

-- Comments
COMMENT ON TABLE autonomous_jobs IS 'Queue for background AI tasks like content generation, SEO, bundling, etc.';
COMMENT ON COLUMN suppliers.integration_status IS 'Tracks whether supplier has been auto-integrated into AI City';
COMMENT ON COLUMN suppliers.brand_voice IS 'AI-analyzed brand tone (playful, professional, luxurious, etc.)';
COMMENT ON COLUMN suppliers.metadata IS 'Stores brand analysis and integration details';

COMMENT ON FUNCTION get_next_job IS 'Atomically retrieves and locks next pending job for processing';
COMMENT ON FUNCTION complete_job IS 'Marks a job as successfully completed';
COMMENT ON FUNCTION fail_job IS 'Marks a job as failed and optionally retries with exponential backoff';
COMMENT ON FUNCTION trigger_supplier_integration IS 'Automatically queues integration job when supplier is approved';
COMMENT ON FUNCTION trigger_product_integration IS 'Automatically queues content generation when product is added';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
