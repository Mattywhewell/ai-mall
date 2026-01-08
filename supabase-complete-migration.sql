-- ============================================================================
-- AI CITY - COMPLETE DATABASE MIGRATION
-- Comprehensive schema for AI-Native Commerce Platform
-- ============================================================================
-- VERSION: 2.0 (Includes World Architecture + v5.1 Engagement Layer)
-- RUN ORDER: 
--   1. Run this migration first
--   2. Run supabase-rls-policies.sql second
--   3. Run supabase-v5.1-seed.sql third (optional demo data)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable vector extension for semantic search (pgvector)
-- Note: If this fails, the products table will still be created without the embedding column
DO $$ 
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
  RAISE NOTICE 'pgvector extension enabled successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'pgvector extension not available. Semantic search features will be disabled.';
END $$;

-- ============================================================================
-- CORE COMMERCE TABLES
-- ============================================================================

-- Microstores (Districts)
CREATE TABLE IF NOT EXISTS microstores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT NOT NULL,
  tags TEXT[],
  microstore_id UUID REFERENCES microstores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add embedding column if pgvector extension is available and column doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE products ADD COLUMN embedding vector(1536);
    RAISE NOTICE 'Added embedding column to products table';
  ELSE
    RAISE NOTICE 'Embedding column already exists in products table';
  END IF;
EXCEPTION WHEN undefined_object THEN
  RAISE WARNING 'Skipping embedding column - pgvector extension not available';
END $$;

-- Create vector index if embedding column exists
DO $$ 
BEGIN
  CREATE INDEX IF NOT EXISTS products_embedding_idx ON products 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  RAISE NOTICE 'Created vector index on products.embedding';
EXCEPTION WHEN undefined_column OR undefined_object THEN
  RAISE WARNING 'Skipping vector index - embedding column not available';
END $$;

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  microstore_id UUID REFERENCES microstores(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  shipping_address JSONB,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Product SEO
CREATE TABLE IF NOT EXISTS product_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[],
  og_title TEXT,
  og_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Social Media
CREATE TABLE IF NOT EXISTS product_social (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  tiktok_hook TEXT,
  instagram_caption TEXT,
  tweet TEXT,
  hashtags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'add_to_cart', 'purchase', 'search')),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  microstore_id UUID REFERENCES microstores(id) ON DELETE SET NULL,
  user_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_event_type_idx ON analytics(event_type);
CREATE INDEX IF NOT EXISTS analytics_product_id_idx ON analytics(product_id);
CREATE INDEX IF NOT EXISTS analytics_microstore_id_idx ON analytics(microstore_id);
CREATE INDEX IF NOT EXISTS analytics_created_at_idx ON analytics(created_at DESC);

-- ============================================================================
-- WORLD ARCHITECTURE (AI City Layers)
-- ============================================================================

-- Halls (Grand Thematic Spaces)
CREATE TABLE IF NOT EXISTS halls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  theme TEXT NOT NULL CHECK (theme IN ('innovation', 'wellness', 'craft', 'motion', 'light')),
  atmosphere JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_spirit_id UUID,
  connected_streets TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_halls_slug ON halls(slug);
CREATE INDEX IF NOT EXISTS idx_halls_theme ON halls(theme);

-- Streets (Navigational Pathways)
CREATE TABLE IF NOT EXISTS streets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  personality TEXT NOT NULL CHECK (personality IN ('neon', 'artisan', 'wellness', 'tech', 'vintage')),
  connects_hall_id UUID REFERENCES halls(id) ON DELETE SET NULL,
  districts TEXT[] DEFAULT '{}',
  popularity_score DECIMAL(5,2) DEFAULT 0,
  trending BOOLEAN DEFAULT FALSE,
  dynamic_order BOOLEAN DEFAULT TRUE,
  atmosphere_tags TEXT[] DEFAULT '{}',
  ai_spirit_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_streets_slug ON streets(slug);
CREATE INDEX IF NOT EXISTS idx_streets_hall ON streets(connects_hall_id);
CREATE INDEX IF NOT EXISTS idx_streets_popularity ON streets(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_streets_trending ON streets(trending);

-- Chapels (Intimate Micro-Environments)
CREATE TABLE IF NOT EXISTS chapels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  emotion TEXT NOT NULL CHECK (emotion IN ('contemplation', 'joy', 'mystery', 'serenity', 'wonder')),
  micro_story TEXT NOT NULL,
  ritual TEXT,
  ai_insight TEXT,
  symbolism TEXT[] DEFAULT '{}',
  connected_to_hall UUID REFERENCES halls(id) ON DELETE SET NULL,
  user_adapted BOOLEAN DEFAULT TRUE,
  ai_spirit_id UUID,
  visit_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chapels_slug ON chapels(slug);
CREATE INDEX IF NOT EXISTS idx_chapels_emotion ON chapels(emotion);
CREATE INDEX IF NOT EXISTS idx_chapels_hall ON chapels(connected_to_hall);

-- AI Spirits (Multi-Agent Personalities)
CREATE TABLE IF NOT EXISTS ai_spirits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('hall', 'chapel', 'street', 'district')),
  entity_id UUID NOT NULL,
  spirit_data JSONB NOT NULL,
  evolution_history JSONB DEFAULT '[]'::jsonb,
  interaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_spirits_entity ON ai_spirits(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_spirits_interactions ON ai_spirits(interaction_count DESC);

-- User World Views (Personalized Rendering)
CREATE TABLE IF NOT EXISTS user_world_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  view_data JSONB NOT NULL,
  atmosphere_preference TEXT DEFAULT 'vibrant',
  last_interaction TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_world_views_user ON user_world_views(user_id);
CREATE INDEX IF NOT EXISTS idx_user_world_views_last_interaction ON user_world_views(last_interaction DESC);

-- World Analytics
CREATE TABLE IF NOT EXISTS world_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_type TEXT NOT NULL CHECK (layer_type IN ('hall', 'street', 'chapel', 'district')),
  entity_id UUID NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value DECIMAL(10,2),
  user_id TEXT,
  session_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_world_analytics_layer ON world_analytics(layer_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_world_analytics_metric ON world_analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_world_analytics_recorded ON world_analytics(recorded_at DESC);

-- Spirit Interactions
CREATE TABLE IF NOT EXISTS spirit_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spirit_id UUID REFERENCES ai_spirits(id) ON DELETE CASCADE,
  user_id TEXT,
  interaction_type TEXT NOT NULL,
  context TEXT,
  response TEXT,
  user_sentiment TEXT,
  time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spirit_interactions_spirit ON spirit_interactions(spirit_id);
CREATE INDEX IF NOT EXISTS idx_spirit_interactions_user ON spirit_interactions(user_id);

-- World Navigation Paths
CREATE TABLE IF NOT EXISTS world_navigation_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  path JSONB NOT NULL,
  total_time INTEGER DEFAULT 0,
  conversion_occurred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_world_nav_paths_user ON world_navigation_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_world_nav_paths_session ON world_navigation_paths(session_id);

-- Atmospheric States
CREATE TABLE IF NOT EXISTS atmospheric_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  state_data JSONB NOT NULL,
  time_of_day TEXT,
  season TEXT,
  user_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atmospheric_states_entity ON atmospheric_states(entity_type, entity_id);

-- ============================================================================
-- V5.1 ENGAGEMENT LAYER (AI Concierge, Live Events, Subscriptions)
-- ============================================================================

-- Users Table (for v5.1 features)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shopping Agents (AI Personal Assistants)
CREATE TABLE IF NOT EXISTS shopping_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  personality TEXT DEFAULT 'helpful' CHECK (personality IN ('helpful', 'enthusiastic', 'professional', 'friendly', 'witty')),
  style_preferences JSONB DEFAULT '{}'::jsonb,
  budget_range JSONB DEFAULT '{}'::jsonb,
  favorite_categories TEXT[] DEFAULT '{}',
  color_preferences TEXT[] DEFAULT '{}',
  total_interactions INTEGER DEFAULT 0,
  recommendation_accuracy DECIMAL(3,2) DEFAULT 0.50,
  learning_data JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_agents_user ON shopping_agents(user_id);

-- Agent Conversations
CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES shopping_agents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'agent', 'system')),
  message TEXT NOT NULL,
  intent TEXT,
  sentiment TEXT,
  products_mentioned UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_agent ON agent_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_created ON agent_conversations(created_at DESC);

-- Agent Recommendations
CREATE TABLE IF NOT EXISTS agent_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES shopping_agents(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  reason TEXT,
  confidence_score DECIMAL(3,2),
  user_feedback TEXT CHECK (user_feedback IN ('liked', 'disliked', 'purchased', 'ignored')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_recommendations_agent ON agent_recommendations(agent_id);

-- Agent Learning Events
CREATE TABLE IF NOT EXISTS agent_learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES shopping_agents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'like', 'purchase', 'search', 'interaction')),
  event_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_learning_agent ON agent_learning_events(agent_id);

-- Live Shopping Events
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
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  stream_url TEXT,
  replay_url TEXT,
  event_discount_percent INTEGER DEFAULT 0,
  viewers_current INTEGER DEFAULT 0,
  viewers_peak INTEGER DEFAULT 0,
  viewers_total INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_events_creator ON live_shopping_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_live_events_status ON live_shopping_events(status);
CREATE INDEX IF NOT EXISTS idx_live_events_start ON live_shopping_events(scheduled_start);

-- Event Attendees
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES live_shopping_events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  watch_duration INTEGER DEFAULT 0,
  purchased BOOLEAN DEFAULT FALSE,
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON event_attendees(event_id);

-- Event Chat Messages
CREATE TABLE IF NOT EXISTS event_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES live_shopping_events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'reaction', 'system')),
  reactions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_chat_event ON event_chat_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_event_chat_created ON event_chat_messages(created_at DESC);

-- Event Product Moments
CREATE TABLE IF NOT EXISTS event_product_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES live_shopping_events(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  timestamp_seconds INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  special_price DECIMAL(10,2),
  clicks_count INTEGER DEFAULT 0,
  purchases_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_moments_event ON event_product_moments(event_id);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  tagline TEXT,
  image_url TEXT,
  price_monthly DECIMAL(10,2),
  price_quarterly DECIMAL(10,2),
  price_annual DECIMAL(10,2),
  products_per_box INTEGER DEFAULT 3,
  estimated_value DECIMAL(10,2),
  shipping_included BOOLEAN DEFAULT TRUE,
  exclusive_products BOOLEAN DEFAULT FALSE,
  early_access BOOLEAN DEFAULT FALSE,
  allow_preferences BOOLEAN DEFAULT TRUE,
  preference_categories TEXT[] DEFAULT '{}',
  skip_allowed BOOLEAN DEFAULT TRUE,
  cancel_anytime BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  subscribers_count INTEGER DEFAULT 0,
  retention_rate DECIMAL(3,2) DEFAULT 0,
  spots_available INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_creator ON subscription_plans(creator_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(active);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
  price_paid DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  start_date DATE NOT NULL,
  next_billing_date DATE,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  shipping_address JSONB,
  user_preferences JSONB DEFAULT '{}'::jsonb,
  boxes_received INTEGER DEFAULT 0,
  lifetime_value DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_subs_plan ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subs_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subs_status ON user_subscriptions(status);

-- Subscription Boxes
CREATE TABLE IF NOT EXISTS subscription_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  box_number INTEGER NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  theme TEXT,
  theme_description TEXT,
  products JSONB DEFAULT '[]'::jsonb,
  total_value DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'packed', 'shipped', 'in_transit', 'delivered', 'skipped')),
  tracking_number TEXT,
  carrier TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_boxes_subscription ON subscription_boxes(subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_boxes_status ON subscription_boxes(status);

-- Subscription Waitlist
CREATE TABLE IF NOT EXISTS subscription_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  position INTEGER,
  notified BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_waitlist_plan ON subscription_waitlist(plan_id);

-- ============================================================================
-- SUBSCRIPTION EXTRAS (Tiers, Items, Deliveries, Gifts, Profiles, Rituals)
-- ============================================================================

-- Subscription Tiers
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tier_type TEXT NOT NULL CHECK (tier_type IN ('ritual_kit', 'district_box', 'ai_curated', 'seasonal', 'mystic', 'explorer')),
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  billing_frequency TEXT NOT NULL CHECK (billing_frequency IN ('monthly', 'quarterly', 'annual')),
  hall_affinity TEXT,
  perks JSONB DEFAULT '[]'::jsonb,
  ai_curation_level TEXT DEFAULT 'standard' CHECK (ai_curation_level IN ('standard', 'enhanced', 'master')),
  max_items_per_box INTEGER DEFAULT 5,
  customization_allowed BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_tiers_slug ON subscription_tiers(slug);

-- Subscription Box Items
CREATE TABLE IF NOT EXISTS subscription_box_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id UUID REFERENCES subscription_boxes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1,
  unit_value DECIMAL(10,2),
  is_exclusive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_box_items_box ON subscription_box_items(box_id);

-- Subscription Deliveries
CREATE TABLE IF NOT EXISTS subscription_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id UUID REFERENCES subscription_boxes(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('preparing', 'shipped', 'out_for_delivery', 'delivered', 'failed')),
  tracking_updates JSONB DEFAULT '[]'::jsonb,
  estimated_delivery DATE,
  actual_delivery TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_box ON subscription_deliveries(box_id);

-- Subscription Gift Codes
CREATE TABLE IF NOT EXISTS subscription_gift_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  duration_months INTEGER NOT NULL,
  recipient_email TEXT,
  recipient_user_id TEXT,
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMPTZ,
  redeemed_by_user_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_codes_code ON subscription_gift_codes(code);

-- AI Curation Profiles
CREATE TABLE IF NOT EXISTS ai_curation_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  taste_profile JSONB DEFAULT '{}'::jsonb,
  style_evolution JSONB DEFAULT '[]'::jsonb,
  surprise_tolerance TEXT DEFAULT 'medium' CHECK (surprise_tolerance IN ('low', 'medium', 'high')),
  learning_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_profiles_user ON ai_curation_profiles(user_id);

-- Ritual Calendar (drop first to avoid column name conflicts)
DROP TABLE IF EXISTS ritual_calendar CASCADE;

CREATE TABLE ritual_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ritual_date DATE NOT NULL UNIQUE,
  ritual_name TEXT NOT NULL,
  description TEXT,
  associated_hall TEXT,
  associated_chapel TEXT,
  special_offerings JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ritual_calendar_date ON ritual_calendar(ritual_date);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
DROP TRIGGER IF EXISTS update_microstores_updated_at ON microstores;
CREATE TRIGGER update_microstores_updated_at BEFORE UPDATE ON microstores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_seo_updated_at ON product_seo;
CREATE TRIGGER update_product_seo_updated_at BEFORE UPDATE ON product_seo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_social_updated_at ON product_social;
CREATE TRIGGER update_product_social_updated_at BEFORE UPDATE ON product_social
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_halls_updated_at ON halls;
CREATE TRIGGER update_halls_updated_at BEFORE UPDATE ON halls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_streets_updated_at ON streets;
CREATE TRIGGER update_streets_updated_at BEFORE UPDATE ON streets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chapels_updated_at ON chapels;
CREATE TRIGGER update_chapels_updated_at BEFORE UPDATE ON chapels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_spirits_updated_at ON ai_spirits;
CREATE TRIGGER update_ai_spirits_updated_at BEFORE UPDATE ON ai_spirits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_world_views_updated_at ON user_world_views;
CREATE TRIGGER update_user_world_views_updated_at BEFORE UPDATE ON user_world_views
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_atmospheric_states_updated_at ON atmospheric_states;
CREATE TRIGGER update_atmospheric_states_updated_at BEFORE UPDATE ON atmospheric_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shopping_agents_updated_at ON shopping_agents;
CREATE TRIGGER update_shopping_agents_updated_at BEFORE UPDATE ON shopping_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_live_events_updated_at ON live_shopping_events;
CREATE TRIGGER update_live_events_updated_at BEFORE UPDATE ON live_shopping_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_boxes_updated_at ON subscription_boxes;
CREATE TRIGGER update_subscription_boxes_updated_at BEFORE UPDATE ON subscription_boxes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_tiers_updated_at ON subscription_tiers;
CREATE TRIGGER update_subscription_tiers_updated_at BEFORE UPDATE ON subscription_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_deliveries_updated_at ON subscription_deliveries;
CREATE TRIGGER update_subscription_deliveries_updated_at BEFORE UPDATE ON subscription_deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_curation_profiles_updated_at ON ai_curation_profiles;
CREATE TRIGGER update_ai_curation_profiles_updated_at BEFORE UPDATE ON ai_curation_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ AI CITY MIGRATION COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  • Core Commerce: 10 tables';
  RAISE NOTICE '  • World Architecture: 9 tables';
  RAISE NOTICE '  • v5.1 Engagement: 22 tables';
  RAISE NOTICE '  • Total: 41 tables';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Run supabase-rls-policies.sql';
  RAISE NOTICE '  2. Run supabase-v5.1-seed.sql (optional)';
  RAISE NOTICE '  3. Configure environment variables';
  RAISE NOTICE '  4. Deploy to Vercel';
  RAISE NOTICE '========================================';
END $$;
