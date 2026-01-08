-- =====================================================
-- AI PROMPT VERSIONING SYSTEM
-- Manages AI prompt versions, tracks changes, enables rollbacks
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
  name TEXT NOT NULL, -- References template name
  version INTEGER NOT NULL,
  prompt_text TEXT NOT NULL,
  variables JSONB DEFAULT '{}', -- Expected variables in prompt
  model TEXT DEFAULT 'gpt-4-turbo-preview',
  temperature NUMERIC(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  is_active BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false, -- Locked versions cannot be deleted
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  change_reason TEXT,
  performance_score NUMERIC(5,2), -- Track prompt performance
  usage_count INTEGER DEFAULT 0,
  UNIQUE(name, version)
);

-- Create indexes
CREATE INDEX idx_prompt_versions_name ON ai_prompt_versions(name);
CREATE INDEX idx_prompt_versions_active ON ai_prompt_versions(name, is_active) WHERE is_active = true;
CREATE INDEX idx_prompt_templates_category ON ai_prompt_templates(category);

-- Enable RLS
ALTER TABLE ai_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_versions ENABLE ROW LEVEL SECURITY;

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

-- Function to update template version numbers
CREATE OR REPLACE FUNCTION update_template_versions()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ai_prompt_templates
    SET 
      latest_version = NEW.version,
      active_version = CASE WHEN NEW.is_active THEN NEW.version ELSE active_version END,
      updated_at = NOW()
    WHERE name = NEW.name;
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

-- Insert initial versions for auto-listing
INSERT INTO ai_prompt_versions (name, version, prompt_text, variables, model, temperature, is_active, created_by) VALUES
  (
    'auto_listing_product_extraction',
    1,
    'You are a product data extraction expert. Extract the following information from the provided URL:
    
1. Product Title (clear, concise)
2. Description (detailed, feature-focused)
3. Price (numeric value only)
4. Category (from our predefined list)
5. Brand (if available)
6. Key Features (bullet points)
7. Technical Specifications (if applicable)
8. Images (URLs)

URL: {{url}}

Return the data in the following JSON format:
{
  "title": "string",
  "description": "string",
  "price": number,
  "category": "string",
  "brand": "string",
  "features": ["string"],
  "specifications": {"key": "value"},
  "images": ["url"]
}',
    '{"url": "string"}',
    'gpt-4-turbo-preview',
    0.3,
    true,
    (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
  ),
  (
    'content_moderation',
    1,
    'Analyze the following content for policy violations:

Content: {{content}}

Check for:
- Inappropriate language
- Prohibited items
- Misleading claims
- Spam/scam indicators
- Copyright violations

Return JSON:
{
  "safe": boolean,
  "violations": ["string"],
  "confidence": number,
  "reason": "string"
}',
    '{"content": "string"}',
    'gpt-4-turbo-preview',
    0.2,
    true,
    (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
  );

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
      ELSE (performance_score + score) / 2 -- Running average
    END
  WHERE name = prompt_name AND version = prompt_version;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE ai_prompt_templates IS 'Stores AI prompt templates with metadata';
COMMENT ON TABLE ai_prompt_versions IS 'Stores versioned AI prompts with configuration';
COMMENT ON COLUMN ai_prompt_versions.is_locked IS 'Locked versions cannot be modified or deleted';
COMMENT ON COLUMN ai_prompt_versions.performance_score IS 'Average performance score (0-100) based on user feedback';
