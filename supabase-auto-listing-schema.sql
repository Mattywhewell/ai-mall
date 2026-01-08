-- Auto-Listing Engine Database Schema
-- Adds tables for pending products and extraction metadata

-- Table for pending products that need review
CREATE TABLE IF NOT EXISTS pending_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  extracted_data JSONB NOT NULL,
  similarity_scores JSONB,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pending_products_supplier ON pending_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_pending_products_status ON pending_products(status);
CREATE INDEX IF NOT EXISTS idx_pending_products_created ON pending_products(created_at DESC);

-- Add extraction metadata columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS extraction_metadata JSONB,
ADD COLUMN IF NOT EXISTS similarity_scores JSONB;

-- Table for tracking auto-listing usage and statistics
CREATE TABLE IF NOT EXISTS auto_listing_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_extractions INTEGER NOT NULL DEFAULT 0,
  successful_extractions INTEGER NOT NULL DEFAULT 0,
  failed_extractions INTEGER NOT NULL DEFAULT 0,
  auto_approved INTEGER NOT NULL DEFAULT 0,
  needs_review INTEGER NOT NULL DEFAULT 0,
  avg_similarity_score NUMERIC(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(supplier_id, date)
);

-- Add index for stats queries
CREATE INDEX IF NOT EXISTS idx_auto_listing_stats_supplier_date ON auto_listing_stats(supplier_id, date DESC);

-- Table for extraction logs
CREATE TABLE IF NOT EXISTS extraction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  processing_time_ms INTEGER,
  extracted_fields JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for logs
CREATE INDEX IF NOT EXISTS idx_extraction_logs_supplier ON extraction_logs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_extraction_logs_created ON extraction_logs(created_at DESC);

-- Function to update extraction stats
CREATE OR REPLACE FUNCTION update_auto_listing_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO auto_listing_stats (
    supplier_id,
    date,
    total_extractions,
    successful_extractions,
    failed_extractions,
    auto_approved,
    needs_review
  )
  VALUES (
    NEW.supplier_id,
    CURRENT_DATE,
    1,
    CASE WHEN NEW.success THEN 1 ELSE 0 END,
    CASE WHEN NOT NEW.success THEN 1 ELSE 0 END,
    0,
    0
  )
  ON CONFLICT (supplier_id, date)
  DO UPDATE SET
    total_extractions = auto_listing_stats.total_extractions + 1,
    successful_extractions = auto_listing_stats.successful_extractions + CASE WHEN NEW.success THEN 1 ELSE 0 END,
    failed_extractions = auto_listing_stats.failed_extractions + CASE WHEN NOT NEW.success THEN 1 ELSE 0 END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats when extraction log is created
CREATE TRIGGER update_extraction_stats
AFTER INSERT ON extraction_logs
FOR EACH ROW
EXECUTE FUNCTION update_auto_listing_stats();

-- Function to update pending product stats
CREATE OR REPLACE FUNCTION update_pending_product_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' OR NEW.status = 'rejected' THEN
    UPDATE auto_listing_stats
    SET 
      auto_approved = auto_approved + CASE WHEN NEW.status = 'approved' THEN 1 ELSE 0 END,
      needs_review = needs_review - 1,
      updated_at = NOW()
    WHERE supplier_id = NEW.supplier_id
      AND date = CURRENT_DATE;
  ELSIF TG_OP = 'INSERT' AND NEW.status = 'pending_review' THEN
    UPDATE auto_listing_stats
    SET 
      needs_review = needs_review + 1,
      updated_at = NOW()
    WHERE supplier_id = NEW.supplier_id
      AND date = CURRENT_DATE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats when pending product status changes
CREATE TRIGGER update_pending_stats
AFTER INSERT OR UPDATE OF status ON pending_products
FOR EACH ROW
EXECUTE FUNCTION update_pending_product_stats();

-- RLS Policies for pending_products
ALTER TABLE pending_products ENABLE ROW LEVEL SECURITY;

-- Suppliers can view and manage their own pending products
CREATE POLICY "Suppliers can view own pending products"
  ON pending_products FOR SELECT
  USING (auth.uid()::uuid IN (
    SELECT user_id FROM suppliers WHERE id = pending_products.supplier_id
  ));

CREATE POLICY "Suppliers can insert pending products"
  ON pending_products FOR INSERT
  WITH CHECK (auth.uid()::uuid IN (
    SELECT user_id FROM suppliers WHERE id = pending_products.supplier_id
  ));

-- Admins can view and manage all pending products
CREATE POLICY "Admins can manage all pending products"
  ON pending_products FOR ALL
  USING (auth.uid()::uuid IN (
    SELECT id FROM auth.users WHERE role = 'admin'
  ));

-- RLS Policies for auto_listing_stats
ALTER TABLE auto_listing_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can view own stats"
  ON auto_listing_stats FOR SELECT
  USING (auth.uid()::uuid IN (
    SELECT user_id FROM suppliers WHERE id = auto_listing_stats.supplier_id
  ));

CREATE POLICY "Admins can view all stats"
  ON auto_listing_stats FOR SELECT
  USING (auth.uid()::uuid IN (
    SELECT id FROM auth.users WHERE role = 'admin'
  ));

-- RLS Policies for extraction_logs
ALTER TABLE extraction_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can view own logs"
  ON extraction_logs FOR SELECT
  USING (auth.uid()::uuid IN (
    SELECT user_id FROM suppliers WHERE id = extraction_logs.supplier_id
  ));

CREATE POLICY "Admins can view all logs"
  ON extraction_logs FOR SELECT
  USING (auth.uid()::uuid IN (
    SELECT id FROM auth.users WHERE role = 'admin'
  ));

-- Add comments for documentation
COMMENT ON TABLE pending_products IS 'Products extracted by auto-listing engine pending manual review';
COMMENT ON TABLE auto_listing_stats IS 'Daily statistics for auto-listing engine usage per supplier';
COMMENT ON TABLE extraction_logs IS 'Detailed logs of each extraction attempt for debugging and analytics';
