-- =====================================================
-- AI CITY v5.1 - SCHEMA MIGRATION (FIXED)
-- Creates tables WITHOUT foreign key constraints to users
-- Run this version if you don't have a users table yet
-- =====================================================

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- AI SHOPPING CONCIERGE SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS shopping_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  agent_name TEXT NOT NULL,
  personality TEXT DEFAULT 'helpful',
  avatar_url TEXT,
  voice_id TEXT,
  
  style_preferences JSONB DEFAULT '{}'::jsonb,
  budget_range JSONB DEFAULT '{}'::jsonb,
  favorite_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  disliked_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  size_preferences JSONB DEFAULT '{}'::jsonb,
  color_preferences TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  total_interactions INTEGER DEFAULT 0,
  successful_recommendations INTEGER DEFAULT 0,
  recommendation_accuracy DECIMAL(3,2) DEFAULT 0.00,
  
  can_auto_purchase BOOLEAN DEFAULT false,
  spending_limit DECIMAL(10,2),
  active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_agents_user ON shopping_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_agents_active ON shopping_agents(active) WHERE active = true;

CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'agent', 'system')),
  message TEXT NOT NULL,
  
  context JSONB DEFAULT '{}'::jsonb,
  products_mentioned UUID[] DEFAULT ARRAY[]::UUID[],
  intent TEXT,
  sentiment TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_conv_agent FOREIGN KEY (agent_id) REFERENCES shopping_agents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_agent ON agent_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_created ON agent_conversations(created_at DESC);

CREATE TABLE IF NOT EXISTS agent_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  product_id UUID NOT NULL,
  
  reason TEXT NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL,
  personalization_factors JSONB DEFAULT '{}'::jsonb,
  
  viewed BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  purchased BOOLEAN DEFAULT false,
  dismissed BOOLEAN DEFAULT false,
  feedback TEXT,
  
  recommended_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  
  CONSTRAINT fk_rec_agent FOREIGN KEY (agent_id) REFERENCES shopping_agents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_agent_recommendations_agent ON agent_recommendations(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_recommendations_user ON agent_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_recommendations_product ON agent_recommendations(product_id);
CREATE INDEX IF NOT EXISTS idx_agent_recommendations_pending ON agent_recommendations(viewed) WHERE viewed = false;

CREATE TABLE IF NOT EXISTS agent_learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  
  event_type TEXT NOT NULL CHECK (event_type IN (
    'product_view', 'product_like', 'product_purchase', 'product_return',
    'search_query', 'filter_change', 'creator_follow', 'review_written',
    'wishlist_add', 'cart_abandon', 'style_quiz', 'feedback_given'
  )),
  
  event_data JSONB NOT NULL,
  learned_insight TEXT,
  confidence_change DECIMAL(3,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_learning_agent FOREIGN KEY (agent_id) REFERENCES shopping_agents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_agent_learning_agent ON agent_learning_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_learning_type ON agent_learning_events(event_type);
CREATE INDEX IF NOT EXISTS idx_agent_learning_created ON agent_learning_events(created_at DESC);

-- =====================================================
-- LIVE SHOPPING EVENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS live_shopping_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  
  stream_url TEXT,
  stream_key TEXT,
  chat_room_id TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'live', 'ended', 'cancelled'
  )),
  
  featured_products UUID[] DEFAULT ARRAY[]::UUID[],
  
  viewers_peak INTEGER DEFAULT 0,
  viewers_total INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0.00,
  
  event_discount_percent INTEGER DEFAULT 0,
  exclusive_products UUID[] DEFAULT ARRAY[]::UUID[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_events_creator ON live_shopping_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_live_events_status ON live_shopping_events(status);
CREATE INDEX IF NOT EXISTS idx_live_events_scheduled ON live_shopping_events(scheduled_start DESC);
CREATE INDEX IF NOT EXISTS idx_live_events_live ON live_shopping_events(status) WHERE status = 'live';

CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  watch_duration INTEGER DEFAULT 0,
  
  messages_sent INTEGER DEFAULT 0,
  products_clicked INTEGER DEFAULT 0,
  purchases_made INTEGER DEFAULT 0,
  amount_spent DECIMAL(10,2) DEFAULT 0.00,
  
  is_vip BOOLEAN DEFAULT false,
  badges TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  CONSTRAINT fk_attendee_event FOREIGN KEY (event_id) REFERENCES live_shopping_events(id) ON DELETE CASCADE,
  CONSTRAINT unique_attendee UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON event_attendees(user_id);

CREATE TABLE IF NOT EXISTS event_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN (
    'text', 'emoji', 'sticker', 'product_share', 'purchase_celebration'
  )),
  
  is_pinned BOOLEAN DEFAULT false,
  is_highlighted BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  deleted_reason TEXT,
  
  reactions JSONB DEFAULT '{}'::jsonb,
  reply_to_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_chat_event FOREIGN KEY (event_id) REFERENCES live_shopping_events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_event_chat_event ON event_chat_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_event_chat_created ON event_chat_messages(created_at DESC);

CREATE TABLE IF NOT EXISTS event_product_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  product_id UUID NOT NULL,
  
  timestamp_seconds INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  clicks INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_moment_event FOREIGN KEY (event_id) REFERENCES live_shopping_events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_event_moments_event ON event_product_moments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_moments_product ON event_product_moments(product_id);

-- =====================================================
-- SUBSCRIPTION BOXES & RECURRING REVENUE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  tagline TEXT,
  image_url TEXT,
  
  price_monthly DECIMAL(10,2) NOT NULL,
  price_quarterly DECIMAL(10,2),
  price_annual DECIMAL(10,2),
  
  products_per_box INTEGER NOT NULL,
  estimated_value DECIMAL(10,2),
  shipping_included BOOLEAN DEFAULT true,
  exclusive_products BOOLEAN DEFAULT false,
  early_access BOOLEAN DEFAULT false,
  
  allow_preferences BOOLEAN DEFAULT true,
  preference_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  skip_allowed BOOLEAN DEFAULT true,
  cancel_anytime BOOLEAN DEFAULT true,
  
  active BOOLEAN DEFAULT true,
  spots_available INTEGER,
  waitlist_enabled BOOLEAN DEFAULT false,
  
  subscribers_count INTEGER DEFAULT 0,
  retention_rate DECIMAL(3,2) DEFAULT 0.00,
  avg_lifetime_months DECIMAL(4,1) DEFAULT 0.0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_creator ON subscription_plans(creator_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(active) WHERE active = true;

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
  price_paid DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'paused', 'cancelled', 'expired', 'payment_failed'
  )),
  
  start_date DATE NOT NULL,
  next_billing_date DATE,
  cancel_date DATE,
  cancel_reason TEXT,
  
  user_preferences JSONB DEFAULT '{}'::jsonb,
  shipping_address JSONB NOT NULL,
  
  boxes_received INTEGER DEFAULT 0,
  boxes_skipped INTEGER DEFAULT 0,
  lifetime_value DECIMAL(10,2) DEFAULT 0.00,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_sub_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_billing ON user_subscriptions(next_billing_date);

CREATE TABLE IF NOT EXISTS subscription_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  
  box_number INTEGER NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  theme TEXT,
  theme_description TEXT,
  
  products JSONB NOT NULL,
  total_value DECIMAL(10,2) NOT NULL,
  
  status TEXT DEFAULT 'preparing' CHECK (status IN (
    'preparing', 'shipped', 'in_transit', 'delivered', 'returned', 'skipped'
  )),
  tracking_number TEXT,
  carrier TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_box_subscription FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  CONSTRAINT fk_box_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscription_boxes_subscription ON subscription_boxes(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_boxes_plan ON subscription_boxes(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_boxes_status ON subscription_boxes(status);
CREATE INDEX IF NOT EXISTS idx_subscription_boxes_month ON subscription_boxes(year, month);

CREATE TABLE IF NOT EXISTS subscription_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  
  position INTEGER,
  notify_when_available BOOLEAN DEFAULT true,
  notified_at TIMESTAMPTZ,
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  CONSTRAINT fk_waitlist_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
  CONSTRAINT unique_waitlist UNIQUE(plan_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_subscription_waitlist_plan ON subscription_waitlist(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_waitlist_position ON subscription_waitlist(plan_id, position);

GRANT ALL ON users TO postgres, anon, authenticated;
GRANT ALL ON shopping_agents TO postgres, anon, authenticated;
GRANT ALL ON agent_conversations TO postgres, anon, authenticated;
GRANT ALL ON agent_recommendations TO postgres, anon, authenticated;
GRANT ALL ON agent_learning_events TO postgres, anon, authenticated;
GRANT ALL ON live_shopping_events TO postgres, anon, authenticated;
GRANT ALL ON event_attendees TO postgres, anon, authenticated;
GRANT ALL ON event_chat_messages TO postgres, anon, authenticated;
GRANT ALL ON event_product_moments TO postgres, anon, authenticated;
GRANT ALL ON subscription_plans TO postgres, anon, authenticated;
GRANT ALL ON user_subscriptions TO postgres, anon, authenticated;
GRANT ALL ON subscription_boxes TO postgres, anon, authenticated;
GRANT ALL ON subscription_waitlist TO postgres, anon, authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Schema migration complete! 13 tables created (including users table)';
  RAISE NOTICE '   You can now run the seed script to add sample data';
END $$;
