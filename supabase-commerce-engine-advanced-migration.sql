-- =====================================================
-- AI COMMERCE ENGINE - ADVANCED FEATURES MIGRATION
-- =====================================================
-- This migration adds support for extended commerce engine features:
-- - Bundles & ritual kits
-- - Digital products
-- - System configuration
-- - Product quality metrics
-- - Supplier risk tracking

-- =====================================================
-- 1. BUNDLES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  price DECIMAL(10, 2) NOT NULL,
  discount_percentage INTEGER DEFAULT 0,
  product_ids UUID[] NOT NULL, -- Array of product IDs in the bundle
  expected_margin DECIMAL(5, 2),
  bundle_score INTEGER CHECK (bundle_score >= 0 AND bundle_score <= 100),
  seasonal BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bundles_active ON bundles(is_active);
CREATE INDEX idx_bundles_seasonal ON bundles(seasonal);
CREATE INDEX idx_bundles_score ON bundles(bundle_score DESC);

-- =====================================================
-- 2. DIGITAL PRODUCTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS digital_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('guide', 'template', 'ritual', 'course', 'checklist')),
  price DECIMAL(10, 2) NOT NULL,
  expected_margin DECIMAL(5, 2) DEFAULT 0.95, -- 95% margin
  related_physical_products UUID[], -- Array of related product IDs
  content_outline TEXT[],
  target_audience TEXT,
  file_url TEXT, -- Download URL
  bundle_opportunity BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  downloads_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_digital_products_type ON digital_products(type);
CREATE INDEX idx_digital_products_active ON digital_products(is_active);
CREATE INDEX idx_digital_products_price ON digital_products(price);

-- =====================================================
-- 3. SYSTEM CONFIGURATION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default scoring weights
INSERT INTO system_config (key, value, description) VALUES 
  ('scoring_weights', '{
    "profitability": 0.35,
    "demand": 0.25,
    "competition": 0.15,
    "supplier_quality": 0.15,
    "strategic_fit": 0.10
  }', 'AI Commerce Engine scoring pillar weights')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 4. EXTEND PRODUCTS TABLE
-- =====================================================

ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  ADD COLUMN IF NOT EXISTS quality_issues JSONB,
  ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5, 4),
  ADD COLUMN IF NOT EXISTS forecast_30_days INTEGER,
  ADD COLUMN IF NOT EXISTS forecast_confidence TEXT CHECK (forecast_confidence IN ('high', 'medium', 'low')),
  ADD COLUMN IF NOT EXISTS recommended_stock INTEGER,
  ADD COLUMN IF NOT EXISTS pricing_strategy TEXT CHECK (pricing_strategy IN ('premium', 'competitive', 'value', 'clearance')),
  ADD COLUMN IF NOT EXISTS price_updated_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

CREATE INDEX idx_products_quality_score ON products(quality_score DESC);
CREATE INDEX idx_products_sales_count ON products(sales_count DESC);
CREATE INDEX idx_products_conversion_rate ON products(conversion_rate DESC);
CREATE INDEX idx_products_priority ON products(priority);
CREATE INDEX idx_products_archived ON products(archived_at);

-- Add bundle_id to orders table for bundle tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bundle_id UUID REFERENCES bundles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_bundle ON orders(bundle_id);

-- =====================================================
-- 5. SUPPLIER RISK TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS supplier_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_factors TEXT[],
  recommendations TEXT[],
  should_pause_imports BOOLEAN DEFAULT false,
  avg_delivery_days DECIMAL(5, 2),
  return_rate DECIMAL(5, 4),
  dispute_rate DECIMAL(5, 4),
  stockout_rate DECIMAL(5, 4),
  response_time_hours DECIMAL(6, 2),
  quality_score DECIMAL(5, 2),
  assessed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_supplier_risk_supplier ON supplier_risk_assessments(supplier_id);
CREATE INDEX idx_supplier_risk_level ON supplier_risk_assessments(risk_level);
CREATE INDEX idx_supplier_risk_score ON supplier_risk_assessments(risk_score DESC);

-- =====================================================
-- 6. SUPPLIER NEGOTIATION TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS supplier_negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  discount_target DECIMAL(5, 2), -- Percentage
  leverage_points TEXT[],
  alternative_terms TEXT[],
  script TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  achieved_discount DECIMAL(5, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_negotiations_supplier ON supplier_negotiations(supplier_id);
CREATE INDEX idx_negotiations_status ON supplier_negotiations(status);
CREATE INDEX idx_negotiations_priority ON supplier_negotiations(priority);

-- =====================================================
-- 7. CATALOG OPTIMIZATION LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS catalog_optimization_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_date DATE NOT NULL,
  products_removed INTEGER DEFAULT 0,
  products_deprioritized INTEGER DEFAULT 0,
  products_promoted INTEGER DEFAULT 0,
  removed_product_ids UUID[],
  deprioritized_product_ids UUID[],
  promoted_product_ids UUID[],
  reasoning JSONB,
  executed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_catalog_optimization_date ON catalog_optimization_log(optimization_date DESC);

-- =====================================================
-- 8. DEMAND FORECASTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS demand_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  forecast_next_30_days INTEGER NOT NULL,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  trend TEXT CHECK (trend IN ('rising', 'stable', 'declining')),
  seasonal_factors TEXT[],
  recommended_stock INTEGER,
  actual_sales INTEGER, -- Filled in after 30 days
  forecast_accuracy DECIMAL(5, 2), -- Calculated after actual sales known
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_forecasts_product ON demand_forecasts(product_id);
CREATE INDEX idx_forecasts_date ON demand_forecasts(forecast_date DESC);
CREATE INDEX idx_forecasts_accuracy ON demand_forecasts(forecast_accuracy DESC);

-- =====================================================
-- 9. WEIGHT EVOLUTION HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS scoring_weight_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weights JSONB NOT NULL,
  sample_size INTEGER NOT NULL, -- How many products used for calculation
  confidence DECIMAL(3, 2) NOT NULL,
  improvements TEXT[],
  applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  applied_at TIMESTAMP
);

CREATE INDEX idx_weight_history_applied ON scoring_weight_history(applied);
CREATE INDEX idx_weight_history_date ON scoring_weight_history(created_at DESC);

-- =====================================================
-- 10. PERFORMANCE DATA (for weight evolution)
-- =====================================================

CREATE TABLE IF NOT EXISTS product_performance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  profitability_score INTEGER,
  demand_score INTEGER,
  competition_score INTEGER,
  supplier_quality_score INTEGER,
  strategic_fit_score INTEGER,
  final_score INTEGER,
  actual_sales INTEGER,
  actual_revenue DECIMAL(10, 2),
  actual_margin DECIMAL(5, 2),
  days_listed INTEGER,
  UNIQUE(product_id, snapshot_date)
);

CREATE INDEX idx_performance_product ON product_performance_snapshots(product_id);
CREATE INDEX idx_performance_date ON product_performance_snapshots(snapshot_date DESC);

-- =====================================================
-- 11. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update bundle updated_at timestamp
CREATE OR REPLACE FUNCTION update_bundle_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bundles_update_timestamp
BEFORE UPDATE ON bundles
FOR EACH ROW
EXECUTE FUNCTION update_bundle_timestamp();

-- Function to update digital product updated_at timestamp
CREATE OR REPLACE FUNCTION update_digital_product_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER digital_products_update_timestamp
BEFORE UPDATE ON digital_products
FOR EACH ROW
EXECUTE FUNCTION update_digital_product_timestamp();

-- Function to calculate conversion rate automatically
CREATE OR REPLACE FUNCTION calculate_conversion_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.view_count > 0 THEN
    NEW.conversion_rate = NEW.sales_count::DECIMAL / NEW.view_count::DECIMAL;
  ELSE
    NEW.conversion_rate = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_calculate_conversion
BEFORE INSERT OR UPDATE OF sales_count, view_count ON products
FOR EACH ROW
EXECUTE FUNCTION calculate_conversion_rate();

-- =====================================================
-- 12. VIEWS FOR REPORTING
-- =====================================================

-- Catalog health overview
CREATE OR REPLACE VIEW catalog_health AS
SELECT
  COUNT(*) FILTER (WHERE active = true) as active_products,
  COUNT(*) FILTER (WHERE quality_score >= 80) as high_quality_products,
  COUNT(*) FILTER (WHERE quality_score < 60) as low_quality_products,
  AVG(quality_score) as avg_quality_score,
  COUNT(*) FILTER (WHERE sales_count = 0 AND created_at < NOW() - INTERVAL '30 days') as stale_products,
  AVG(conversion_rate) as avg_conversion_rate,
  SUM(sales_count) as total_sales,
  SUM(view_count) as total_views
FROM products
WHERE archived_at IS NULL;

-- Supplier risk overview
CREATE OR REPLACE VIEW supplier_risk_overview AS
SELECT
  s.id,
  s.business_name,
  sra.risk_level,
  sra.risk_score,
  sra.should_pause_imports,
  COUNT(p.id) as active_products,
  sra.assessed_at
FROM suppliers s
LEFT JOIN supplier_risk_assessments sra ON sra.id = (
  SELECT id FROM supplier_risk_assessments
  WHERE supplier_id = s.id
  ORDER BY assessed_at DESC
  LIMIT 1
)
LEFT JOIN products p ON p.supplier_id = s.id AND p.active = true
GROUP BY s.id, s.business_name, sra.risk_level, sra.risk_score, sra.should_pause_imports, sra.assessed_at;

-- Bundle performance
CREATE OR REPLACE VIEW bundle_performance AS
SELECT
  b.id,
  b.name,
  b.price,
  b.discount_percentage,
  b.bundle_score,
  b.seasonal,
  COUNT(o.id) as orders_count,
  SUM(o.total_amount) as total_revenue
FROM bundles b
LEFT JOIN orders o ON o.bundle_id = b.id
WHERE b.is_active = true
GROUP BY b.id, b.name, b.price, b.discount_percentage, b.bundle_score, b.seasonal;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Grant permissions (adjust roles as needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
