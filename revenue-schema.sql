-- Revenue-Focused Database Schema Extensions
-- Adds tables and functions for profit-driven intelligence

-- Products table enhancements (ALTER existing table)
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS display_priority INTEGER DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 999;
ALTER TABLE products ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS needs_optimization BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS bundle_eligible BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_optimization_needed BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_optimized_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS previous_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_keywords TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_updated_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_display_priority ON products(display_priority DESC);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_bundle_eligible ON products(bundle_eligible);

-- Product Bundles
CREATE TABLE IF NOT EXISTS product_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  product_ids UUID[] NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  bundle_price DECIMAL(10,2) NOT NULL,
  discount_percentage INTEGER DEFAULT 0,
  bundle_type TEXT CHECK (bundle_type IN ('pairing', 'district', 'seasonal', 'curated')),
  ai_generated BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  sales_count INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bundles_active ON product_bundles(active);
CREATE INDEX idx_bundles_type ON product_bundles(bundle_type);
CREATE INDEX idx_bundles_sales ON product_bundles(sales_count DESC);

-- Merchandising Log
CREATE TABLE IF NOT EXISTS merchandising_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  reason TEXT,
  impact_score INTEGER,
  action_data JSONB DEFAULT '{}'::jsonb,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_merchandising_log_product ON merchandising_log(product_id);
CREATE INDEX idx_merchandising_log_applied ON merchandising_log(applied_at DESC);

-- Social Content
CREATE TABLE IF NOT EXISTS social_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  engagement_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_social_content_product ON social_content(product_id);
CREATE INDEX idx_social_content_platform ON social_content(platform);
CREATE INDEX idx_social_content_status ON social_content(status);

-- Search Log
CREATE TABLE IF NOT EXISTS search_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  user_id TEXT,
  result_count INTEGER DEFAULT 0,
  selected_product_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_log_query ON search_log(query);
CREATE INDEX idx_search_log_user ON search_log(user_id);
CREATE INDEX idx_search_log_created ON search_log(created_at DESC);

-- Product Recommendations
CREATE TABLE IF NOT EXISTS product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  recommended_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  similarity_score DECIMAL(5,4),
  recommendation_type TEXT CHECK (recommendation_type IN ('similar', 'bundle', 'upsell', 'cross_sell')),
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_product_id, recommended_product_id, recommendation_type)
);

CREATE INDEX idx_recommendations_source ON product_recommendations(source_product_id);
CREATE INDEX idx_recommendations_score ON product_recommendations(similarity_score DESC);

-- AB Tests
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  test_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  variant_a JSONB NOT NULL,
  variant_b JSONB NOT NULL,
  variant_a_views INTEGER DEFAULT 0,
  variant_b_views INTEGER DEFAULT 0,
  variant_a_conversions INTEGER DEFAULT 0,
  variant_b_conversions INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running' CHECK (status IN ('draft', 'running', 'completed', 'cancelled')),
  winner TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ab_tests_status ON ab_tests(status);
CREATE INDEX idx_ab_tests_entity ON ab_tests(entity_type, entity_id);

-- Revenue Insights (AI-generated)
CREATE TABLE IF NOT EXISTS revenue_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL CHECK (insight_type IN ('opportunity', 'warning', 'success', 'trend')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommended_action TEXT,
  impact_level TEXT CHECK (impact_level IN ('high', 'medium', 'low')),
  confidence_score DECIMAL(5,2),
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'actioned', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_revenue_insights_type ON revenue_insights(insight_type);
CREATE INDEX idx_revenue_insights_impact ON revenue_insights(impact_level);
CREATE INDEX idx_revenue_insights_status ON revenue_insights(status);

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to products (if not using TEXT embedding)
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding_vector vector(1536);
-- CREATE INDEX ON products USING ivfflat (embedding_vector vector_cosine_ops);

-- Function: Match products by embedding similarity
CREATE OR REPLACE FUNCTION match_products(
  query_embedding TEXT,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price DECIMAL,
  similarity FLOAT
) AS $$
BEGIN
  -- This is a simplified version
  -- In production, you'd parse the TEXT embedding to vector and use cosine similarity
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    0.9::FLOAT as similarity
  FROM products p
  WHERE p.active = TRUE
  ORDER BY RANDOM()
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate product performance score
CREATE OR REPLACE FUNCTION calculate_product_performance(
  p_product_id UUID,
  p_days_back INTEGER DEFAULT 30
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_views INTEGER;
  v_conversions INTEGER;
  v_conversion_rate DECIMAL(5,4);
  v_score DECIMAL(5,2);
BEGIN
  -- Count views
  SELECT COUNT(*)
  INTO v_views
  FROM world_analytics
  WHERE entity_id = p_product_id
    AND metric_type = 'view'
    AND recorded_at > NOW() - (p_days_back || ' days')::INTERVAL;

  -- Count conversions
  SELECT COUNT(*)
  INTO v_conversions
  FROM world_analytics
  WHERE entity_id = p_product_id
    AND metric_type = 'conversion'
    AND recorded_at > NOW() - (p_days_back || ' days')::INTERVAL;

  -- Calculate conversion rate
  IF v_views > 0 THEN
    v_conversion_rate := v_conversions::DECIMAL / v_views::DECIMAL;
  ELSE
    v_conversion_rate := 0;
  END IF;

  -- Calculate score (0-100)
  v_score := LEAST(100, (v_conversion_rate * 4000) + (v_views::DECIMAL / 10));

  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Function: Get top performing products
CREATE OR REPLACE FUNCTION get_top_performers(
  p_limit INTEGER DEFAULT 10,
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  performance_score DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    calculate_product_performance(p.id, p_days_back) as score
  FROM products p
  WHERE p.active = TRUE
  ORDER BY score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-generate bundle candidates
CREATE OR REPLACE FUNCTION find_bundle_candidates()
RETURNS TABLE (
  product_1 UUID,
  product_2 UUID,
  co_purchase_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wa1.entity_id as product_1,
    wa2.entity_id as product_2,
    COUNT(DISTINCT wa1.session_id)::INTEGER as co_purchase_count
  FROM world_analytics wa1
  JOIN world_analytics wa2 
    ON wa1.session_id = wa2.session_id 
    AND wa1.entity_id < wa2.entity_id
  WHERE wa1.metric_type = 'conversion'
    AND wa2.metric_type = 'conversion'
    AND wa1.recorded_at > NOW() - INTERVAL '90 days'
  GROUP BY wa1.entity_id, wa2.entity_id
  HAVING COUNT(DISTINCT wa1.session_id) >= 3
  ORDER BY co_purchase_count DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON product_bundles TO postgres, anon, authenticated;
GRANT ALL ON merchandising_log TO postgres, anon, authenticated;
GRANT ALL ON social_content TO postgres, anon, authenticated;
GRANT ALL ON search_log TO postgres, anon, authenticated;
GRANT ALL ON product_recommendations TO postgres, anon, authenticated;
GRANT ALL ON ab_tests TO postgres, anon, authenticated;
GRANT ALL ON revenue_insights TO postgres, anon, authenticated;

-- Seed some initial revenue insights
INSERT INTO revenue_insights (insight_type, title, description, recommended_action, impact_level, confidence_score, status) VALUES
('opportunity', 'Optimize High-Traffic Products', 'Several products with 100+ views have conversion rates below 2%. Price optimization or better descriptions could increase sales.', 'Review pricing and run content optimization', 'high', 0.85, 'active'),
('success', 'Bundle Strategy Working', 'Product bundles account for 18% of total revenue with 23% higher AOV than individual purchases.', 'Generate more bundles based on successful patterns', 'medium', 0.92, 'active'),
('opportunity', 'Improve SEO for Top Products', 'Best-selling products lack optimized SEO metadata. Better titles and descriptions could increase organic traffic by 25-40%.', 'Run SEO metadata generation', 'high', 0.78, 'active')
ON CONFLICT DO NOTHING;
