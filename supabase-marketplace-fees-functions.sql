-- =====================================================
-- PILLAR 3: MARKETPLACE FEES - Automatic Deduction
-- =====================================================

-- Function to calculate and record marketplace fee
CREATE OR REPLACE FUNCTION process_marketplace_transaction(
  p_order_id TEXT,
  p_product_id UUID,
  p_supplier_id UUID,
  p_sale_amount DECIMAL(10,2),
  p_stripe_payment_intent_id TEXT
)
RETURNS marketplace_transactions AS $$
DECLARE
  v_fee_percentage DECIMAL(5,2);
  v_marketplace_fee DECIMAL(10,2);
  v_supplier_payout DECIMAL(10,2);
  v_transaction marketplace_transactions;
BEGIN
  -- Get fee percentage from product (default 10%)
  SELECT COALESCE(marketplace_fee_percentage, 10.00) INTO v_fee_percentage
  FROM products WHERE id = p_product_id;
  
  -- Calculate amounts
  v_marketplace_fee := p_sale_amount * (v_fee_percentage / 100);
  v_supplier_payout := p_sale_amount - v_marketplace_fee;
  
  -- Insert transaction record
  INSERT INTO marketplace_transactions (
    order_id,
    product_id,
    supplier_id,
    sale_amount,
    marketplace_fee,
    supplier_payout,
    stripe_payment_intent_id,
    fee_collected
  ) VALUES (
    p_order_id,
    p_product_id,
    p_supplier_id,
    p_sale_amount,
    v_marketplace_fee,
    v_supplier_payout,
    p_stripe_payment_intent_id,
    true
  ) RETURNING * INTO v_transaction;
  
  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql;

-- View for supplier revenue breakdown
CREATE OR REPLACE VIEW supplier_revenue_breakdown AS
SELECT 
  s.id as supplier_id,
  s.business_name,
  COUNT(mt.id) as total_sales,
  SUM(mt.sale_amount) as gross_revenue,
  SUM(mt.marketplace_fee) as total_fees_paid,
  SUM(mt.supplier_payout) as net_revenue,
  ROUND(AVG(mt.marketplace_fee / mt.sale_amount * 100), 2) as avg_fee_percentage
FROM suppliers s
LEFT JOIN marketplace_transactions mt ON s.id = mt.supplier_id
GROUP BY s.id, s.business_name;

COMMENT ON VIEW supplier_revenue_breakdown IS 'Shows revenue breakdown with marketplace fees for each supplier';
