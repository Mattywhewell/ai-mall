-- =====================================================
-- 🚀 COMPLETE DATABASE MIGRATION SCRIPT
-- Run this in Supabase SQL Editor in the following order
-- =====================================================

-- =====================================================
-- PART 1: AI PROMPT VERSIONING SYSTEM
-- =====================================================

-- Create prompt templates table
CREATE TABLE IF NOT EXISTS ai_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('auto_listing', 'recommendation', 'search', 'moderation', 'other')),
  latest_version INTEGER DEFAULT 0,
  active_version INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create prompt versions table
CREATE TABLE IF NOT EXISTS ai_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version INTEGER NOT NULL,
  prompt_text TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  model TEXT DEFAULT 'gpt-4-turbo-preview',
  temperature NUMERIC(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  is_active BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  change_reason TEXT,
  performance_score NUMERIC(5,2),
  usage_count INTEGER DEFAULT 0,
  UNIQUE(name, version)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prompt_versions_name ON ai_prompt_versions(name);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_active ON ai_prompt_versions(name, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON ai_prompt_templates(category);

-- Enable RLS
ALTER TABLE ai_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_versions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admins full access to prompt templates" ON ai_prompt_templates;
DROP POLICY IF EXISTS "Allow AI agents to read active prompts" ON ai_prompt_templates;
DROP POLICY IF EXISTS "Allow admins full access to prompt versions" ON ai_prompt_versions;
DROP POLICY IF EXISTS "Allow AI agents to read active versions" ON ai_prompt_versions;

-- RLS Policies for ai_prompt_templates
CREATE POLICY "Allow admins full access to prompt templates"
  ON ai_prompt_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow AI agents to read active prompts"
  ON ai_prompt_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'ai_agent'
    )
  );

-- RLS Policies for ai_prompt_versions
CREATE POLICY "Allow admins full access to prompt versions"
  ON ai_prompt_versions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow AI agents to read active versions"
  ON ai_prompt_versions
  FOR SELECT
  TO authenticated
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'ai_agent'
    )
  );

-- Function to update template versions
CREATE OR REPLACE FUNCTION update_template_versions()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO ai_prompt_templates (name, latest_version, active_version)
    VALUES (NEW.name, NEW.version, CASE WHEN NEW.is_active THEN NEW.version ELSE 0 END)
    ON CONFLICT (name) DO UPDATE
    SET 
      latest_version = GREATEST(ai_prompt_templates.latest_version, NEW.version),
      active_version = CASE WHEN NEW.is_active THEN NEW.version ELSE ai_prompt_templates.active_version END,
      updated_at = NOW();
  ELSIF TG_OP = 'UPDATE' AND NEW.is_active AND NOT OLD.is_active THEN
    UPDATE ai_prompt_templates
    SET 
      active_version = NEW.version,
      updated_at = NOW()
    WHERE name = NEW.name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_template_versions ON ai_prompt_versions;

-- Trigger to update template versions
CREATE TRIGGER trigger_update_template_versions
  AFTER INSERT OR UPDATE ON ai_prompt_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_template_versions();

-- Function to prevent modification of locked versions
CREATE OR REPLACE FUNCTION prevent_locked_version_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_locked THEN
    RAISE EXCEPTION 'Cannot modify or delete locked prompt version';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_prevent_locked_modification ON ai_prompt_versions;

-- Trigger to prevent locked version changes
CREATE TRIGGER trigger_prevent_locked_modification
  BEFORE UPDATE OR DELETE ON ai_prompt_versions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_locked_version_modification();

-- Insert default prompt templates
INSERT INTO ai_prompt_templates (name, description, category) VALUES
  ('auto_listing_product_extraction', 'Extract product details from URLs for auto-listing', 'auto_listing'),
  ('auto_listing_image_analysis', 'Analyze product images for quality and content', 'auto_listing'),
  ('product_recommendation', 'Generate personalized product recommendations', 'recommendation'),
  ('search_query_enhancement', 'Enhance user search queries for better results', 'search'),
  ('content_moderation', 'Moderate user-generated content', 'moderation'),
  ('product_description_generation', 'Generate compelling product descriptions', 'auto_listing'),
  ('category_classification', 'Classify products into appropriate categories', 'auto_listing'),
  ('price_validation', 'Validate and suggest appropriate pricing', 'auto_listing')
ON CONFLICT (name) DO NOTHING;

-- Function to track prompt usage
CREATE OR REPLACE FUNCTION increment_prompt_usage(prompt_name TEXT, prompt_version INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE ai_prompt_versions
  SET usage_count = usage_count + 1
  WHERE name = prompt_name AND version = prompt_version;
END;
$$ LANGUAGE plpgsql;

-- Function to update prompt performance score
CREATE OR REPLACE FUNCTION update_prompt_performance(
  prompt_name TEXT,
  prompt_version INTEGER,
  score NUMERIC
)
RETURNS void AS $$
BEGIN
  UPDATE ai_prompt_versions
  SET 
    performance_score = CASE
      WHEN performance_score IS NULL THEN score
      ELSE (performance_score + score) / 2
    END
  WHERE name = prompt_name AND version = prompt_version;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created
SELECT 'Tables created:' AS status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ai_prompt_templates', 'ai_prompt_versions');

-- Check if indexes were created
SELECT 'Indexes created:' AS status;
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('ai_prompt_templates', 'ai_prompt_versions');

-- Check if functions were created
SELECT 'Functions created:' AS status;
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_template_versions', 'prevent_locked_version_modification', 'increment_prompt_usage', 'update_prompt_performance');

-- Check prompt templates
SELECT 'Prompt templates:' AS status;
SELECT name, category, latest_version, active_version FROM ai_prompt_templates;

SELECT '✅ Migration complete!' AS status;
