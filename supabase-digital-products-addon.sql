-- Digital Product Purchases Table (for download access tracking)
CREATE TABLE IF NOT EXISTS digital_product_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  product_id UUID REFERENCES digital_products(id) NOT NULL,
  customer_email TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  
  downloaded_at TIMESTAMP WITH TIME ZONE,
  download_count INTEGER DEFAULT 0
);

CREATE INDEX idx_digital_purchases_email ON digital_product_purchases(customer_email);
CREATE INDEX idx_digital_purchases_product ON digital_product_purchases(product_id);

-- Function to increment digital product stats
CREATE OR REPLACE FUNCTION increment_digital_product_stats(
  p_product_id UUID,
  p_revenue DECIMAL(10,2)
)
RETURNS void AS $$
BEGIN
  UPDATE digital_products
  SET 
    downloads = downloads + 1,
    revenue_generated = revenue_generated + p_revenue,
    updated_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Add navigation link visibility
COMMENT ON TABLE digital_products IS 'AI Mall Digital Products - 100% margin revenue stream (Pillar 1)';
