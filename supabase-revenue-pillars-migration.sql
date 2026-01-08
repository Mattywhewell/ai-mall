-- =====================================================
-- AI MALL REVENUE PILLARS DATABASE SCHEMA
-- Complete monetization infrastructure
-- =====================================================

-- =====================================================
-- PILLAR 1: AI-Generated Digital Products
-- =====================================================

CREATE TABLE IF NOT EXISTS digital_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Product Details
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('template', 'brand_kit', 'guide', 'course', 'bundle', 'ritual_kit', 'ai_agent')),
  category TEXT,
  tags TEXT[],
  
  -- Pricing (100% margin)
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- AI Generation
  generated_by TEXT NOT NULL, -- 'ai_engine', 'curator', 'assistant'
  generation_prompt TEXT,
  generation_model TEXT,
  
  -- Content
  content_url TEXT, -- S3/storage URL
  preview_url TEXT,
  thumbnail_url TEXT,
  file_format TEXT, -- 'pdf', 'zip', 'json', 'figma', etc.
  file_size_bytes BIGINT,
  
  -- Metadata
  downloads INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'premium'))
);

CREATE INDEX idx_digital_products_type ON digital_products(type);
CREATE INDEX idx_digital_products_status ON digital_products(status, visibility);
CREATE INDEX idx_digital_products_revenue ON digital_products(revenue_generated DESC);

-- =====================================================
-- PILLAR 2: Subscription Plans
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Plan Details
  name TEXT NOT NULL UNIQUE, -- 'Free', 'Creator', 'Pro', 'Enterprise'
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  tagline TEXT,
  
  -- Pricing
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2), -- Discounted annual price
  currency TEXT DEFAULT 'USD',
  
  -- Limits
  features JSONB NOT NULL, -- {"ai_storefronts": 1, "products": 100, "analytics": "basic"}
  limits JSONB NOT NULL, -- {"api_calls": 1000, "ai_credits": 500}
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User & Plan
  user_id TEXT NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id),
  
  -- Subscription Status
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trial', 'expired')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  
  -- Stripe Integration
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  
  -- Dates
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  
  -- Usage Tracking
  usage_data JSONB DEFAULT '{}', -- {"api_calls": 450, "ai_credits_used": 200}
  
  UNIQUE(user_id, plan_id)
);

CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_stripe ON user_subscriptions(stripe_subscription_id);

-- =====================================================
-- PILLAR 3: Marketplace Fees (Enhanced)
-- =====================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS marketplace_fee_percentage DECIMAL(5,2) DEFAULT 10.00;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS marketplace_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Transaction Details
  order_id TEXT NOT NULL,
  product_id UUID REFERENCES products(id),
  supplier_id UUID,
  
  -- Amounts
  sale_amount DECIMAL(10,2) NOT NULL,
  marketplace_fee DECIMAL(10,2) NOT NULL,
  supplier_payout DECIMAL(10,2) NOT NULL,
  
  -- Stripe
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  
  -- Status
  fee_collected BOOLEAN DEFAULT false,
  payout_sent BOOLEAN DEFAULT false,
  payout_date TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_marketplace_transactions_order ON marketplace_transactions(order_id);
CREATE INDEX idx_marketplace_transactions_supplier ON marketplace_transactions(supplier_id);
CREATE INDEX idx_marketplace_transactions_fees ON marketplace_transactions(fee_collected, payout_sent);

-- =====================================================
-- PILLAR 4: Supplier Onboarding Fees
-- =====================================================

CREATE TABLE IF NOT EXISTS supplier_onboarding_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Package Details
  name TEXT NOT NULL, -- 'Basic', 'Premium', 'Enterprise'
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  
  -- Features
  features JSONB NOT NULL, -- {"ai_catalog": true, "brand_analysis": true, "market_insights": true}
  
  -- Benefits
  product_limit INTEGER, -- NULL = unlimited
  priority_placement BOOLEAN DEFAULT false,
  dedicated_support BOOLEAN DEFAULT false,
  
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS supplier_onboarding_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  supplier_id UUID NOT NULL,
  package_id UUID REFERENCES supplier_onboarding_packages(id),
  amount_paid DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  
  -- Fulfillment
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_supplier_onboarding_supplier ON supplier_onboarding_purchases(supplier_id);

-- =====================================================
-- PILLAR 5: AI Automation Credits
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_ai_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  credits_balance INTEGER DEFAULT 0,
  credits_purchased INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  last_purchase_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  user_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus')),
  credits_amount INTEGER NOT NULL,
  
  -- Usage Details
  operation_type TEXT, -- 'product_generation', 'forecasting', 'negotiation', 'pricing', 'bundle_creation'
  operation_cost INTEGER,
  operation_metadata JSONB,
  
  -- Purchase Details
  package_id UUID REFERENCES ai_credit_packages(id),
  stripe_payment_intent_id TEXT,
  amount_paid DECIMAL(10,2)
);

CREATE INDEX idx_user_ai_credits_user ON user_ai_credits(user_id);
CREATE INDEX idx_ai_credit_transactions_user ON ai_credit_transactions(user_id, created_at DESC);

-- =====================================================
-- PILLAR 6: Featured Placement & Ads
-- =====================================================

CREATE TABLE IF NOT EXISTS featured_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Placement Details
  placement_type TEXT NOT NULL CHECK (placement_type IN ('homepage_hero', 'category_featured', 'district_spotlight', 'hall_banner', 'search_sponsored')),
  position INTEGER, -- Order priority
  
  -- Advertiser
  supplier_id UUID NOT NULL,
  product_id UUID REFERENCES products(id),
  
  -- Campaign
  title TEXT,
  description TEXT,
  image_url TEXT,
  cta_text TEXT,
  target_url TEXT,
  
  -- Dates
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Pricing
  daily_budget DECIMAL(10,2),
  total_budget DECIMAL(10,2),
  cost_per_click DECIMAL(10,4),
  cost_per_impression DECIMAL(10,4),
  
  -- Performance
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  spend_total DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'rejected')),
  is_approved BOOLEAN DEFAULT false
);

CREATE INDEX idx_featured_placements_supplier ON featured_placements(supplier_id);
CREATE INDEX idx_featured_placements_type ON featured_placements(placement_type, status);
CREATE INDEX idx_featured_placements_dates ON featured_placements(start_date, end_date) WHERE status = 'active';

-- =====================================================
-- PILLAR 7: White-Label Licensing
-- =====================================================

CREATE TABLE IF NOT EXISTS white_label_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Licensee Details
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  
  -- License Type
  license_type TEXT NOT NULL CHECK (license_type IN ('agency', 'enterprise', 'saas', 'startup')),
  features_enabled JSONB NOT NULL, -- Which modules they get access to
  
  -- Pricing
  monthly_fee DECIMAL(10,2) NOT NULL,
  setup_fee DECIMAL(10,2) DEFAULT 0,
  revenue_share_percentage DECIMAL(5,2), -- Optional revenue share on their sales
  
  -- Domain & Branding
  custom_domain TEXT,
  branding_config JSONB, -- Colors, logos, etc.
  
  -- Limits
  max_users INTEGER,
  max_products INTEGER,
  max_api_calls INTEGER,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('trial', 'active', 'suspended', 'canceled')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Stripe
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT
);

CREATE INDEX idx_white_label_licenses_status ON white_label_licenses(status);

-- =====================================================
-- PILLAR 8: Affiliate Revenue
-- =====================================================

CREATE TABLE IF NOT EXISTS affiliate_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Program Details
  program_name TEXT NOT NULL,
  partner_name TEXT NOT NULL,
  partner_url TEXT,
  
  -- Commission Structure
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'fixed', 'tiered')),
  commission_rate DECIMAL(5,2), -- Percentage
  commission_fixed DECIMAL(10,2), -- Fixed amount
  commission_tiers JSONB, -- For tiered commissions
  
  -- Tracking
  affiliate_link_template TEXT,
  cookie_duration_days INTEGER DEFAULT 30,
  
  -- Categories
  product_categories TEXT[], -- What types of products/services
  
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  user_id TEXT, -- Who clicked the link
  program_id UUID REFERENCES affiliate_programs(id),
  
  -- Tracking
  referral_code TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  
  -- Conversion
  converted BOOLEAN DEFAULT false,
  conversion_date TIMESTAMP WITH TIME ZONE,
  conversion_value DECIMAL(10,2),
  commission_earned DECIMAL(10,2),
  
  -- Payout
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'approved', 'paid')),
  payout_date TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_affiliate_referrals_user ON affiliate_referrals(user_id);
CREATE INDEX idx_affiliate_referrals_program ON affiliate_referrals(program_id, converted);

-- =====================================================
-- PILLAR 9: AI Citizens & Premium Personalization
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_citizen_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Product Details
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('custom_citizen', 'personalized_world', 'story_arc', 'ritual', 'companion', 'agent')),
  description TEXT,
  
  -- Pricing Tiers
  price_tier TEXT NOT NULL CHECK (price_tier IN ('basic', 'premium', 'deluxe')),
  price_monthly DECIMAL(10,2),
  price_onetime DECIMAL(10,2),
  
  -- Customization Options
  customization_options JSONB, -- Available customizations
  generation_complexity INTEGER, -- 1-10 scale
  
  -- Content
  preview_url TEXT,
  template_data JSONB,
  
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_ai_citizens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  user_id TEXT NOT NULL,
  product_id UUID REFERENCES ai_citizen_products(id),
  
  -- Citizen Details
  citizen_name TEXT,
  citizen_personality JSONB,
  citizen_appearance JSONB,
  citizen_backstory TEXT,
  
  -- Interaction Data
  relationship_level INTEGER DEFAULT 1,
  total_interactions INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  
  -- Subscription
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'paused', 'canceled')),
  stripe_subscription_id TEXT
);

CREATE INDEX idx_user_ai_citizens_user ON user_ai_citizens(user_id);

-- =====================================================
-- PILLAR 10: Analytics as a Service
-- =====================================================

CREATE TABLE IF NOT EXISTS analytics_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  user_id TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  key_name TEXT,
  
  -- Access Control
  access_level TEXT DEFAULT 'basic' CHECK (access_level IN ('basic', 'pro', 'enterprise')),
  allowed_endpoints TEXT[],
  rate_limit_per_hour INTEGER DEFAULT 100,
  
  -- Usage
  total_requests INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS analytics_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  api_key_id UUID REFERENCES analytics_api_keys(id),
  user_id TEXT NOT NULL,
  
  -- Request Details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  query_params JSONB,
  
  -- Response
  status_code INTEGER,
  response_time_ms INTEGER,
  
  -- Billing
  credits_charged INTEGER DEFAULT 1
);

CREATE INDEX idx_analytics_api_usage_key ON analytics_api_usage(api_key_id, created_at DESC);
CREATE INDEX idx_analytics_api_usage_user ON analytics_api_usage(user_id, created_at DESC);

-- =====================================================
-- Seed Data: Subscription Plans
-- =====================================================

INSERT INTO subscription_plans (name, slug, description, tagline, price_monthly, price_yearly, features, limits, display_order, is_featured) VALUES
('Free', 'free', 'Perfect for exploring AI Mall', 'Start your journey', 0, 0, 
  '{"ai_storefronts": 0, "products": 10, "analytics": "basic", "ai_credits": 100}',
  '{"api_calls": 100, "ai_credits": 100}', 1, false),

('Creator', 'creator', 'For independent creators and small businesses', 'Bring your brand to life', 29, 290,
  '{"ai_storefronts": 1, "products": 100, "analytics": "advanced", "ai_credits": 1000, "automation": "basic"}',
  '{"api_calls": 1000, "ai_credits": 1000}', 2, true),

('Pro', 'pro', 'For growing businesses with automation needs', 'Scale with confidence', 99, 990,
  '{"ai_storefronts": 5, "products": 1000, "analytics": "pro", "ai_credits": 5000, "automation": "advanced", "forecasting": true, "dynamic_pricing": true}',
  '{"api_calls": 10000, "ai_credits": 5000}', 3, false),

('Enterprise', 'enterprise', 'For large organizations and agencies', 'Unlimited power', 499, 4990,
  '{"ai_storefronts": -1, "products": -1, "analytics": "enterprise", "ai_credits": 50000, "automation": "full", "multi_agent": true, "white_label": true, "api_access": true}',
  '{"api_calls": 100000, "ai_credits": 50000}', 4, false)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- Seed Data: AI Credit Packages
-- =====================================================

INSERT INTO ai_credit_packages (name, credits, price, bonus_credits) VALUES
('Starter Pack', 500, 9.99, 0),
('Growth Pack', 2000, 29.99, 200),
('Pro Pack', 5000, 69.99, 750),
('Enterprise Pack', 20000, 199.99, 5000)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Seed Data: Supplier Onboarding Packages
-- =====================================================

INSERT INTO supplier_onboarding_packages (name, slug, description, price, features, product_limit, priority_placement, dedicated_support) VALUES
('Basic', 'basic', 'Essential onboarding for new suppliers', 0, 
  '{"ai_catalog": false, "brand_analysis": false, "market_insights": false}', 50, false, false),

('Premium', 'premium', 'AI-powered onboarding with automation', 299,
  '{"ai_catalog": true, "brand_analysis": true, "market_insights": true, "automated_listing": true}', 500, true, false),

('Enterprise', 'enterprise', 'Full-service onboarding with dedicated support', 999,
  '{"ai_catalog": true, "brand_analysis": true, "market_insights": true, "automated_listing": true, "custom_integration": true, "api_access": true}', NULL, true, true)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- RLS Policies (Security)
-- =====================================================

ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_citizens ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can view their own credits
CREATE POLICY "Users can view own credits" ON user_ai_credits
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can view their own AI citizens
CREATE POLICY "Users can view own AI citizens" ON user_ai_citizens
  FOR SELECT USING (auth.uid()::text = user_id);

-- Public can view active digital products
CREATE POLICY "Public can view active digital products" ON digital_products
  FOR SELECT USING (status = 'active' AND visibility = 'public');

COMMENT ON TABLE digital_products IS 'AI-generated digital goods with 100% margin';
COMMENT ON TABLE subscription_plans IS 'Tiered subscription offerings for recurring revenue';
COMMENT ON TABLE marketplace_transactions IS 'Commission tracking for marketplace fees';
COMMENT ON TABLE supplier_onboarding_packages IS 'Paid onboarding tiers for suppliers';
COMMENT ON TABLE ai_credit_packages IS 'Credit packages for AI automation usage';
COMMENT ON TABLE featured_placements IS 'Paid advertising and featured placement system';
COMMENT ON TABLE white_label_licenses IS 'White-label licensing for agencies and enterprises';
COMMENT ON TABLE affiliate_programs IS 'Affiliate marketing and referral revenue tracking';
COMMENT ON TABLE ai_citizen_products IS 'Premium AI companions and personalization products';
COMMENT ON TABLE analytics_api_keys IS 'Analytics-as-a-Service API access management';
