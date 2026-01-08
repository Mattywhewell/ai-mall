-- =====================================================
-- AI Commerce Engine Migration
-- Adds scoring and decision fields for automated product evaluation
-- =====================================================

-- Add Commerce Engine fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS commerce_score INTEGER,
ADD COLUMN IF NOT EXISTS commerce_decision TEXT,
ADD COLUMN IF NOT EXISTS commerce_reasoning TEXT,
ADD COLUMN IF NOT EXISTS commerce_last_scored TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS profitability_score INTEGER,
ADD COLUMN IF NOT EXISTS demand_score INTEGER,
ADD COLUMN IF NOT EXISTS competition_score INTEGER,
ADD COLUMN IF NOT EXISTS supplier_quality_score INTEGER,
ADD COLUMN IF NOT EXISTS strategic_fit_score INTEGER,
ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS bundle_potential BOOLEAN DEFAULT false;

-- Create indexes for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_products_commerce_score 
ON products(commerce_score DESC) 
WHERE commerce_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_commerce_decision 
ON products(commerce_decision) 
WHERE commerce_decision IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_profit_margin 
ON products(profit_margin DESC) 
WHERE profit_margin IS NOT NULL;

-- Add constraints for valid decisions
ALTER TABLE products 
ADD CONSTRAINT check_commerce_decision 
CHECK (commerce_decision IN ('import_high_priority', 'import_low_priority', 'import_for_bundles', 'reject') OR commerce_decision IS NULL);

-- Add constraints for score ranges (0-100)
ALTER TABLE products 
ADD CONSTRAINT check_commerce_score 
CHECK (commerce_score >= 0 AND commerce_score <= 100 OR commerce_score IS NULL);

ALTER TABLE products 
ADD CONSTRAINT check_profitability_score 
CHECK (profitability_score >= 0 AND profitability_score <= 100 OR profitability_score IS NULL);

ALTER TABLE products 
ADD CONSTRAINT check_demand_score 
CHECK (demand_score >= 0 AND demand_score <= 100 OR demand_score IS NULL);

ALTER TABLE products 
ADD CONSTRAINT check_competition_score 
CHECK (competition_score >= 0 AND competition_score <= 100 OR competition_score IS NULL);

ALTER TABLE products 
ADD CONSTRAINT check_supplier_quality_score 
CHECK (supplier_quality_score >= 0 AND supplier_quality_score <= 100 OR supplier_quality_score IS NULL);

ALTER TABLE products 
ADD CONSTRAINT check_strategic_fit_score 
CHECK (strategic_fit_score >= 0 AND strategic_fit_score <= 100 OR strategic_fit_score IS NULL);

-- Add comments to document the fields
COMMENT ON COLUMN products.commerce_score IS 'Final weighted score (0-100) from AI Commerce Engine';
COMMENT ON COLUMN products.commerce_decision IS 'Import decision: import_high_priority, import_low_priority, import_for_bundles, or reject';
COMMENT ON COLUMN products.commerce_reasoning IS 'AI-generated explanation for the import decision';
COMMENT ON COLUMN products.commerce_last_scored IS 'Timestamp of last commerce engine evaluation';
COMMENT ON COLUMN products.profitability_score IS 'Profitability pillar score (35% weight)';
COMMENT ON COLUMN products.demand_score IS 'Demand pillar score (25% weight)';
COMMENT ON COLUMN products.competition_score IS 'Competition pillar score (15% weight, inverted)';
COMMENT ON COLUMN products.supplier_quality_score IS 'Supplier quality pillar score (15% weight)';
COMMENT ON COLUMN products.strategic_fit_score IS 'Strategic fit pillar score (10% weight)';
COMMENT ON COLUMN products.profit_margin IS 'Calculated profit margin (0.00-1.00)';
COMMENT ON COLUMN products.bundle_potential IS 'Whether product has potential for bundle creation';

-- =====================================================
-- Sample Queries
-- =====================================================

-- Get all approved products sorted by score
-- SELECT 
--   id, 
--   name, 
--   commerce_score, 
--   commerce_decision,
--   profit_margin,
--   commerce_last_scored
-- FROM products
-- WHERE commerce_decision != 'reject'
-- ORDER BY commerce_score DESC
-- LIMIT 20;

-- Get products that need re-evaluation (rejected over 30 days ago)
-- SELECT 
--   id, 
--   name, 
--   commerce_score, 
--   commerce_decision,
--   commerce_last_scored
-- FROM products
-- WHERE commerce_decision = 'reject'
--   AND commerce_last_scored < NOW() - INTERVAL '30 days'
-- ORDER BY commerce_last_scored ASC
-- LIMIT 50;

-- Get high-margin products for featured promotions
-- SELECT 
--   id, 
--   name, 
--   price,
--   profit_margin,
--   commerce_score
-- FROM products
-- WHERE profit_margin >= 0.40
--   AND commerce_decision IN ('import_high_priority', 'import_low_priority')
--   AND is_active = true
-- ORDER BY profit_margin DESC
-- LIMIT 10;

-- Get bundle-ready products
-- SELECT 
--   id, 
--   name, 
--   category,
--   bundle_potential,
--   strategic_fit_score
-- FROM products
-- WHERE bundle_potential = true
--   AND commerce_decision != 'reject'
-- ORDER BY strategic_fit_score DESC;

-- Commerce engine performance metrics
-- SELECT 
--   commerce_decision,
--   COUNT(*) as product_count,
--   AVG(commerce_score) as avg_score,
--   AVG(profit_margin) as avg_margin,
--   SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_count
-- FROM products
-- WHERE commerce_score IS NOT NULL
-- GROUP BY commerce_decision
-- ORDER BY avg_score DESC;
