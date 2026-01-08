-- =====================================================
-- Stripe Connect Integration Migration
-- Adds fields to enable Stripe Connect OAuth for suppliers
-- =====================================================

-- Add Stripe Connect fields to suppliers table
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_connected_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster Stripe account lookups
CREATE INDEX IF NOT EXISTS idx_suppliers_stripe_account 
ON suppliers(stripe_account_id) 
WHERE stripe_account_id IS NOT NULL;

-- Add comment to document the fields
COMMENT ON COLUMN suppliers.stripe_account_id IS 'Stripe Connect account ID (acct_xxx) for receiving payouts';
COMMENT ON COLUMN suppliers.stripe_connected_at IS 'Timestamp when supplier connected their Stripe account';

-- Update metadata column to include Stripe info (if not already done)
-- This allows storing additional Stripe details like onboarding status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    CREATE INDEX IF NOT EXISTS idx_suppliers_metadata_gin ON suppliers USING gin(metadata);
  END IF;
END $$;

COMMENT ON COLUMN suppliers.metadata IS 'JSON metadata including Stripe onboarding details, verification status, etc.';

-- =====================================================
-- Sample Query: Find all connected suppliers
-- =====================================================
-- SELECT 
--   id, 
--   business_name, 
--   email, 
--   stripe_account_id, 
--   stripe_connected_at
-- FROM suppliers
-- WHERE stripe_account_id IS NOT NULL
-- ORDER BY stripe_connected_at DESC;

-- =====================================================
-- Sample Query: Suppliers ready for payouts
-- =====================================================
-- SELECT 
--   s.id,
--   s.business_name,
--   s.stripe_account_id,
--   COUNT(o.id) as pending_orders,
--   SUM(o.total_amount) as pending_revenue
-- FROM suppliers s
-- LEFT JOIN orders o ON o.vendor_id = s.id AND o.payout_status = 'pending'
-- WHERE s.stripe_account_id IS NOT NULL
-- GROUP BY s.id, s.business_name, s.stripe_account_id;
