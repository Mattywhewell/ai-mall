-- ============================================================================
-- Hybrid Supplier Payout System - Migration Script
-- ============================================================================
-- This migration is IDEMPOTENT - safe to run multiple times
-- Adds payout functionality to the supplier ecosystem

-- 1. Create payout method enum type if not exists
DO $$ BEGIN
  CREATE TYPE payout_method AS ENUM ('instant', 'monthly', 'weekly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create payout status enum type if not exists
DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Add payout fields to suppliers table (if they don't exist)
ALTER TABLE IF EXISTS suppliers
  ADD COLUMN IF NOT EXISTS payout_method payout_method DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS payout_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS last_payout_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS next_payout_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payout_notes TEXT,
  ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 15.00,
  ADD COLUMN IF NOT EXISTS minimum_payout_threshold DECIMAL(10,2) DEFAULT 50.00;

-- 4. Create supplier_payouts table
CREATE TABLE IF NOT EXISTS supplier_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  payout_method payout_method NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status payout_status DEFAULT 'pending',
  
  -- Payout details
  stripe_transfer_id VARCHAR(255),
  stripe_payout_id VARCHAR(255),
  payout_email VARCHAR(255),
  
  -- Date tracking
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  order_count INTEGER DEFAULT 0,
  revenue_ids UUID[],
  admin_notes TEXT,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_supplier_payouts_supplier_id ON supplier_payouts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payouts_status ON supplier_payouts(status);
CREATE INDEX IF NOT EXISTS idx_supplier_payouts_period ON supplier_payouts(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_supplier_payouts_created_at ON supplier_payouts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suppliers_payout_method ON suppliers(payout_method);
CREATE INDEX IF NOT EXISTS idx_suppliers_next_payout ON suppliers(next_payout_date);

-- 6. Create revenue tracking table enhancement
-- Add payout reference to revenue table (if revenue table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'revenue') THEN
    ALTER TABLE revenue
      ADD COLUMN IF NOT EXISTS payout_id UUID REFERENCES supplier_payouts(id),
      ADD COLUMN IF NOT EXISTS payout_status VARCHAR(20) DEFAULT 'unpaid';
    
    CREATE INDEX IF NOT EXISTS idx_revenue_payout_status ON revenue(payout_status);
    CREATE INDEX IF NOT EXISTS idx_revenue_payout_id ON revenue(payout_id);
  END IF;
END $$;

-- 7. Create payout_transactions table for audit trail
CREATE TABLE IF NOT EXISTS payout_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL REFERENCES supplier_payouts(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'initiation', 'processing', 'completion', 'failure', 'reversal'
  status payout_status NOT NULL,
  amount DECIMAL(10,2),
  description TEXT,
  metadata JSONB,
  created_by UUID, -- admin user who triggered action
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_transactions_payout_id ON payout_transactions(payout_id);
CREATE INDEX IF NOT EXISTS idx_payout_transactions_type ON payout_transactions(transaction_type);

-- 8. Create function to calculate supplier earnings
CREATE OR REPLACE FUNCTION calculate_supplier_earnings(
  p_supplier_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  total_revenue DECIMAL(10,2),
  commission_amount DECIMAL(10,2),
  net_amount DECIMAL(10,2),
  order_count INTEGER,
  revenue_ids UUID[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(r.amount), 0)::DECIMAL(10,2) AS total_revenue,
    COALESCE(SUM(r.amount * (s.commission_rate / 100)), 0)::DECIMAL(10,2) AS commission_amount,
    COALESCE(SUM(r.amount * (1 - s.commission_rate / 100)), 0)::DECIMAL(10,2) AS net_amount,
    COUNT(r.id)::INTEGER AS order_count,
    ARRAY_AGG(r.id) AS revenue_ids
  FROM revenue r
  JOIN suppliers s ON s.id = r.supplier_id
  WHERE r.supplier_id = p_supplier_id
    AND r.created_at >= p_start_date
    AND r.created_at < p_end_date
    AND (r.payout_status = 'unpaid' OR r.payout_status IS NULL)
  GROUP BY s.commission_rate;
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to update next payout date
CREATE OR REPLACE FUNCTION update_next_payout_date(
  p_supplier_id UUID,
  p_payout_method payout_method
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  v_next_date TIMESTAMP WITH TIME ZONE;
BEGIN
  CASE p_payout_method
    WHEN 'instant' THEN
      -- For instant payouts, next payout is immediate (can be null or current time)
      v_next_date := NOW();
    WHEN 'weekly' THEN
      -- Next payout is next Monday
      v_next_date := DATE_TRUNC('week', NOW()) + INTERVAL '1 week';
    WHEN 'monthly' THEN
      -- Next payout is first day of next month
      v_next_date := DATE_TRUNC('month', NOW()) + INTERVAL '1 month';
  END CASE;
  
  UPDATE suppliers
  SET next_payout_date = v_next_date,
      last_payout_date = NOW()
  WHERE id = p_supplier_id;
  
  RETURN v_next_date;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_supplier_payouts_updated_at ON supplier_payouts;
CREATE TRIGGER update_supplier_payouts_updated_at
  BEFORE UPDATE ON supplier_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 11. Create view for payout summary
CREATE OR REPLACE VIEW supplier_payout_summary AS
SELECT 
  s.id AS supplier_id,
  s.business_name,
  s.payout_method,
  s.stripe_account_id,
  s.payout_email,
  s.commission_rate,
  s.minimum_payout_threshold,
  s.last_payout_date,
  s.next_payout_date,
  COUNT(sp.id) AS total_payouts,
  COALESCE(SUM(CASE WHEN sp.status = 'completed' THEN sp.net_amount ELSE 0 END), 0) AS total_paid,
  COALESCE(SUM(CASE WHEN sp.status = 'pending' THEN sp.net_amount ELSE 0 END), 0) AS pending_amount,
  MAX(sp.completed_at) AS last_completed_payout
FROM suppliers s
LEFT JOIN supplier_payouts sp ON sp.supplier_id = s.id
GROUP BY s.id, s.business_name, s.payout_method, s.stripe_account_id, 
         s.payout_email, s.commission_rate, s.minimum_payout_threshold,
         s.last_payout_date, s.next_payout_date;

-- 12. Grant necessary permissions (adjust as needed for your security model)
-- GRANT SELECT, INSERT, UPDATE ON supplier_payouts TO authenticated;
-- GRANT SELECT, INSERT ON payout_transactions TO authenticated;
-- GRANT SELECT ON supplier_payout_summary TO authenticated;

-- 13. Seed default payout dates for existing suppliers
UPDATE suppliers
SET next_payout_date = CASE payout_method
  WHEN 'weekly' THEN DATE_TRUNC('week', NOW()) + INTERVAL '1 week'
  WHEN 'monthly' THEN DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
  WHEN 'instant' THEN NOW()
  ELSE DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
END
WHERE next_payout_date IS NULL;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- To verify the migration:
-- SELECT * FROM supplier_payout_summary;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name LIKE 'payout%';
-- SELECT * FROM supplier_payouts LIMIT 5;
