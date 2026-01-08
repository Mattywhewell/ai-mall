-- ============================================================================
-- AI CITY - PERFORMANCE OPTIMIZATION INDEXES
-- Add missing indexes for foreign key constraints
-- ============================================================================
-- RUN ORDER: Run AFTER supabase-complete-migration.sql, supabase-rls-policies.sql, 
--            and supabase-seed-complete.sql
-- PURPOSE: Adds covering indexes for foreign keys to improve query performance
-- ============================================================================

-- Add index for cart_items.product_id foreign key
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id 
ON cart_items(product_id);

-- Add index for order_items.order_id foreign key
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON order_items(order_id);

-- Add index for order_items.product_id foreign key
CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
ON order_items(product_id);

-- Add index for subscription_gift_codes.tier_id foreign key
CREATE INDEX IF NOT EXISTS idx_subscription_gift_codes_tier_id 
ON subscription_gift_codes(tier_id);

-- Add index for vendors.microstore_id foreign key
CREATE INDEX IF NOT EXISTS idx_vendors_microstore_id 
ON vendors(microstore_id);

-- Verification
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PERFORMANCE INDEXES CREATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Added 5 foreign key covering indexes:';
  RAISE NOTICE '  • cart_items.product_id';
  RAISE NOTICE '  • order_items.order_id';
  RAISE NOTICE '  • order_items.product_id';
  RAISE NOTICE '  • subscription_gift_codes.tier_id';
  RAISE NOTICE '  • vendors.microstore_id';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Note: "Unused index" warnings are normal';
  RAISE NOTICE 'for a freshly seeded database. Indexes';
  RAISE NOTICE 'will be utilized as query traffic begins.';
  RAISE NOTICE '========================================';
END $$;
