-- =====================================================
-- SCALING INFRASTRUCTURE - Growth & Performance
-- =====================================================

-- Referral System (Viral Growth)
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  user_id TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  
  -- Rewards
  referrer_reward_type TEXT DEFAULT 'credits' CHECK (referrer_reward_type IN ('credits', 'discount', 'cash')),
  referrer_reward_amount DECIMAL(10,2) DEFAULT 50,
  referee_reward_type TEXT DEFAULT 'discount',
  referee_reward_amount DECIMAL(10,2) DEFAULT 20,
  
  -- Stats
  uses_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  total_revenue_generated DECIMAL(10,2) DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS referral_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  referral_code_id UUID REFERENCES referral_codes(id),
  referred_user_id TEXT,
  
  converted BOOLEAN DEFAULT false,
  conversion_date TIMESTAMP WITH TIME ZONE,
  conversion_value DECIMAL(10,2),
  
  referrer_rewarded BOOLEAN DEFAULT false,
  referee_rewarded BOOLEAN DEFAULT false
);

-- Email Campaigns (Marketing Automation)
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('promotional', 'transactional', 'drip', 'abandoned_cart', 'win_back')),
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  
  -- Targeting
  target_segment JSONB, -- {plan: "free", last_login: "30d", etc}
  
  -- Scheduling
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Performance
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  campaign_id UUID REFERENCES email_campaigns(id),
  user_email TEXT NOT NULL,
  user_id TEXT,
  
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  conversion_value DECIMAL(10,2)
);

-- A/B Testing
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pricing', 'ui', 'copy', 'feature')),
  
  variant_a JSONB NOT NULL,
  variant_b JSONB NOT NULL,
  
  -- Stats
  variant_a_views INTEGER DEFAULT 0,
  variant_a_conversions INTEGER DEFAULT 0,
  variant_b_views INTEGER DEFAULT 0,
  variant_b_conversions INTEGER DEFAULT 0,
  
  status TEXT DEFAULT 'running' CHECK (status IN ('draft', 'running', 'completed')),
  winner TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Customer Lifetime Value Tracking
CREATE TABLE IF NOT EXISTS customer_ltv (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  user_id TEXT UNIQUE NOT NULL,
  
  -- Spending
  total_spent DECIMAL(10,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  
  -- Engagement
  first_purchase_date TIMESTAMP WITH TIME ZONE,
  last_purchase_date TIMESTAMP WITH TIME ZONE,
  days_active INTEGER DEFAULT 0,
  
  -- Predicted LTV
  predicted_ltv DECIMAL(10,2),
  churn_risk_score DECIMAL(3,2), -- 0-1
  
  -- Segments
  segment TEXT, -- 'whale', 'regular', 'at_risk', 'churned'
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum'))
);

-- Product Performance Analytics
CREATE TABLE IF NOT EXISTS product_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  product_id UUID,
  
  views INTEGER DEFAULT 0,
  add_to_cart INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  
  conversion_rate DECIMAL(5,4),
  
  UNIQUE(date, product_id)
);

-- Growth Metrics (Daily Snapshots)
CREATE TABLE IF NOT EXISTS growth_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  
  -- User Acquisition
  new_users INTEGER DEFAULT 0,
  activated_users INTEGER DEFAULT 0,
  
  -- Revenue
  daily_revenue DECIMAL(10,2) DEFAULT 0,
  mrr DECIMAL(10,2) DEFAULT 0,
  arr DECIMAL(10,2) DEFAULT 0,
  
  -- Products
  products_listed INTEGER DEFAULT 0,
  products_sold INTEGER DEFAULT 0,
  
  -- Suppliers
  active_suppliers INTEGER DEFAULT 0,
  new_suppliers INTEGER DEFAULT 0,
  
  -- Engagement
  dau INTEGER DEFAULT 0,
  wau INTEGER DEFAULT 0,
  mau INTEGER DEFAULT 0
);

-- Push Notifications
CREATE TABLE IF NOT EXISTS push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  user_id TEXT NOT NULL,
  
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  
  category TEXT CHECK (category IN ('order', 'promotion', 'recommendation', 'system'))
);

-- Waitlists (for exclusive features)
CREATE TABLE IF NOT EXISTS waitlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  feature_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_id TEXT,
  
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'invited', 'activated')),
  invited_at TIMESTAMP WITH TIME ZONE,
  activated_at TIMESTAMP WITH TIME ZONE,
  
  referrals_count INTEGER DEFAULT 0,
  priority_score INTEGER DEFAULT 0
);

-- Bulk Operations Tracking
CREATE TABLE IF NOT EXISTS bulk_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  operation_type TEXT NOT NULL,
  user_id TEXT NOT NULL,
  
  total_items INTEGER NOT NULL,
  processed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  error_log JSONB
);

-- Performance Indexes
CREATE INDEX idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX idx_referral_uses_code ON referral_uses(referral_code_id);
CREATE INDEX idx_email_sends_campaign ON email_sends(campaign_id);
CREATE INDEX idx_email_sends_user ON email_sends(user_email);
CREATE INDEX idx_customer_ltv_segment ON customer_ltv(segment, tier);
CREATE INDEX idx_product_analytics_date ON product_analytics(date DESC);
CREATE INDEX idx_growth_metrics_date ON growth_metrics(date DESC);

-- Function: Update Customer LTV
CREATE OR REPLACE FUNCTION update_customer_ltv(p_user_id TEXT)
RETURNS void AS $$
DECLARE
  v_total_spent DECIMAL(10,2);
  v_total_orders INTEGER;
  v_first_purchase TIMESTAMP;
  v_last_purchase TIMESTAMP;
  v_days_active INTEGER;
BEGIN
  -- Calculate metrics
  SELECT 
    COALESCE(SUM(amount), 0),
    COUNT(*),
    MIN(created_at),
    MAX(created_at)
  INTO v_total_spent, v_total_orders, v_first_purchase, v_last_purchase
  FROM orders
  WHERE user_id = p_user_id AND status = 'completed';
  
  v_days_active := EXTRACT(DAY FROM (v_last_purchase - v_first_purchase));
  
  -- Upsert LTV record
  INSERT INTO customer_ltv (
    user_id,
    total_spent,
    total_orders,
    avg_order_value,
    first_purchase_date,
    last_purchase_date,
    days_active,
    predicted_ltv,
    segment
  ) VALUES (
    p_user_id,
    v_total_spent,
    v_total_orders,
    CASE WHEN v_total_orders > 0 THEN v_total_spent / v_total_orders ELSE 0 END,
    v_first_purchase,
    v_last_purchase,
    v_days_active,
    v_total_spent * 3, -- Simple prediction: 3x current value
    CASE 
      WHEN v_total_spent > 1000 THEN 'whale'
      WHEN v_total_spent > 200 THEN 'regular'
      WHEN v_days_active < 30 THEN 'at_risk'
      ELSE 'active'
    END
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_spent = EXCLUDED.total_spent,
    total_orders = EXCLUDED.total_orders,
    avg_order_value = EXCLUDED.avg_order_value,
    last_purchase_date = EXCLUDED.last_purchase_date,
    days_active = EXCLUDED.days_active,
    predicted_ltv = EXCLUDED.predicted_ltv,
    segment = EXCLUDED.segment,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function: Daily Growth Snapshot
CREATE OR REPLACE FUNCTION capture_daily_growth_metrics()
RETURNS void AS $$
DECLARE
  v_date DATE := CURRENT_DATE;
BEGIN
  INSERT INTO growth_metrics (
    date,
    daily_revenue,
    mrr,
    products_sold,
    active_suppliers,
    dau
  )
  SELECT
    v_date,
    COALESCE(SUM(amount), 0),
    (SELECT COALESCE(SUM(price_monthly), 0) FROM user_subscriptions 
     JOIN subscription_plans ON user_subscriptions.plan_id = subscription_plans.id
     WHERE user_subscriptions.status = 'active'),
    COUNT(DISTINCT order_id),
    (SELECT COUNT(DISTINCT supplier_id) FROM products WHERE status = 'active'),
    COUNT(DISTINCT user_id)
  FROM orders
  WHERE DATE(created_at) = v_date
  ON CONFLICT (date) DO UPDATE SET
    daily_revenue = EXCLUDED.daily_revenue,
    mrr = EXCLUDED.mrr,
    products_sold = EXCLUDED.products_sold,
    active_suppliers = EXCLUDED.active_suppliers,
    dau = EXCLUDED.dau;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE referral_codes IS 'Viral growth - referral system with rewards';
COMMENT ON TABLE email_campaigns IS 'Marketing automation - email campaigns';
COMMENT ON TABLE ab_tests IS 'A/B testing for optimization';
COMMENT ON TABLE customer_ltv IS 'Customer lifetime value tracking';
COMMENT ON TABLE growth_metrics IS 'Daily growth KPIs snapshot';
