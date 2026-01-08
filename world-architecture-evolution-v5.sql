-- ============================================
-- AI CITY v5.0 EVOLUTION SCHEMA
-- "The Awakening" - Creator Economy, Guilds, Dreams, Premium AI
-- ============================================
-- APPEND THIS TO world-architecture-schema.sql

-- ============================================
-- CREATOR ECONOMY SYSTEM
-- ============================================

-- Vendor Applications (Users become merchants)
CREATE TABLE IF NOT EXISTS vendor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  brand_story TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('craft', 'digital', 'wellness', 'tech', 'art', 'ritual')),
  portfolio_urls TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '{}'::jsonb,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'professional', 'master')),
  requested_hall TEXT,
  requested_street TEXT,
  application_status TEXT DEFAULT 'pending' CHECK (application_status IN ('pending', 'reviewing', 'approved', 'rejected', 'waitlisted')),
  reviewed_by TEXT,
  reviewer_notes TEXT,
  approval_fee DECIMAL(10,2) DEFAULT 99.00,
  monthly_fee DECIMAL(10,2) DEFAULT 49.00,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_vendor_applications_user ON vendor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_status ON vendor_applications(application_status);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_category ON vendor_applications(category);

-- Creator Storefronts
CREATE TABLE IF NOT EXISTS creator_storefronts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  storefront_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  brand_identity JSONB NOT NULL, -- Colors, fonts, voice
  location_hall_id UUID REFERENCES halls(id),
  location_street_id UUID REFERENCES streets(id),
  storefront_tier TEXT DEFAULT 'basic' CHECK (storefront_tier IN ('basic', 'premium', 'enterprise')),
  ai_assistant_enabled BOOLEAN DEFAULT FALSE,
  ai_assistant_personality JSONB,
  custom_domain TEXT,
  total_sales_count INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  rating_average DECIMAL(2,1) DEFAULT 5.0,
  rating_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'suspended', 'closed')),
  featured BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  badges TEXT[] DEFAULT '{}', -- 'top_seller', 'rising_star', 'artisan_verified'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_storefronts_vendor ON creator_storefronts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_creator_storefronts_slug ON creator_storefronts(slug);
CREATE INDEX IF NOT EXISTS idx_creator_storefronts_user ON creator_storefronts(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_storefronts_tier ON creator_storefronts(storefront_tier);
CREATE INDEX IF NOT EXISTS idx_creator_storefronts_featured ON creator_storefronts(featured);

-- Creator Products (User-generated inventory)
CREATE TABLE IF NOT EXISTS creator_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id UUID REFERENCES creator_storefronts(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  product_type TEXT CHECK (product_type IN ('physical', 'digital', 'service', 'experience', 'nft')),
  base_price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  inventory_count INTEGER,
  unlimited_inventory BOOLEAN DEFAULT FALSE,
  images TEXT[] DEFAULT '{}',
  model_3d_url TEXT,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  customization_options JSONB DEFAULT '{}'::jsonb,
  ai_generated_description TEXT,
  ai_generated_tags TEXT[] DEFAULT '{}',
  sales_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'soldout', 'archived')),
  featured_in_hall BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(storefront_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_creator_products_storefront ON creator_products(storefront_id);
CREATE INDEX IF NOT EXISTS idx_creator_products_slug ON creator_products(slug);
CREATE INDEX IF NOT EXISTS idx_creator_products_status ON creator_products(status);
CREATE INDEX IF NOT EXISTS idx_creator_products_sales ON creator_products(sales_count DESC);

-- Creator Revenue Tracking
CREATE TABLE IF NOT EXISTS creator_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id UUID REFERENCES creator_storefronts(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'subscription', 'tip', 'commission', 'fee', 'payout')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  platform_fee DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL,
  related_order_id TEXT,
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'completed', 'failed')),
  payout_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_revenue_storefront ON creator_revenue(storefront_id);
CREATE INDEX IF NOT EXISTS idx_creator_revenue_type ON creator_revenue(transaction_type);
CREATE INDEX IF NOT EXISTS idx_creator_revenue_payout_status ON creator_revenue(payout_status);

-- ============================================
-- GUILDS & CIRCLES (Social Organizations)
-- ============================================

-- Guilds (User-created communities)
CREATE TABLE IF NOT EXISTS guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  guild_type TEXT NOT NULL CHECK (guild_type IN ('craft', 'ritual', 'exploration', 'commerce', 'learning', 'social')),
  description TEXT,
  founder_user_id TEXT NOT NULL,
  emblem_url TEXT,
  color_theme TEXT[] DEFAULT '{}',
  hall_affinity TEXT, -- Primary hall
  member_count INTEGER DEFAULT 1,
  max_members INTEGER DEFAULT 100,
  privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'invite_only')),
  entry_requirements JSONB DEFAULT '{}'::jsonb, -- {min_level: 5, required_achievements: []}
  guild_perks JSONB DEFAULT '[]'::jsonb, -- Exclusive quests, discounts, items
  guild_hall_id UUID, -- Custom guild hall (premium feature)
  total_guild_xp BIGINT DEFAULT 0,
  guild_level INTEGER DEFAULT 1,
  reputation_score DECIMAL(10,2) DEFAULT 0,
  achievements TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disbanded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guilds_slug ON guilds(slug);
CREATE INDEX IF NOT EXISTS idx_guilds_type ON guilds(guild_type);
CREATE INDEX IF NOT EXISTS idx_guilds_founder ON guilds(founder_user_id);
CREATE INDEX IF NOT EXISTS idx_guilds_level ON guilds(guild_level DESC);

-- Guild Members
CREATE TABLE IF NOT EXISTS guild_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('founder', 'officer', 'veteran', 'member', 'initiate')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  contribution_points INTEGER DEFAULT 0,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  UNIQUE(guild_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_guild_members_guild ON guild_members(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_user ON guild_members(user_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_role ON guild_members(role);

-- Guild Activities (Shared quests, rituals, events)
CREATE TABLE IF NOT EXISTS guild_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('quest', 'ritual', 'event', 'raid', 'celebration', 'competition')),
  activity_name TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  location TEXT,
  participants TEXT[] DEFAULT '{}',
  rewards JSONB DEFAULT '{}'::jsonb,
  completion_status TEXT DEFAULT 'planned' CHECK (completion_status IN ('planned', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guild_activities_guild ON guild_activities(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_activities_type ON guild_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_guild_activities_status ON guild_activities(completion_status);

-- ============================================
-- DREAM SEQUENCES (Alternate Reality Layer)
-- ============================================

-- Dream Dimensions (Parallel realities)
CREATE TABLE IF NOT EXISTS dream_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_name TEXT NOT NULL,
  dimension_type TEXT CHECK (dimension_type IN ('lucid', 'nightmare', 'memory', 'prophecy', 'void', 'ascension')),
  base_hall_id UUID REFERENCES halls(id),
  atmosphere_shift JSONB NOT NULL, -- How it differs from base reality
  time_dilation DECIMAL(3,2) DEFAULT 1.0, -- Time moves differently
  emotional_intensity DECIMAL(2,1) DEFAULT 1.0, -- Emotions amplified/dampened
  available_hours TEXT[] DEFAULT '{}', -- Only accessible at certain times
  moon_phase_requirement TEXT,
  entry_cost_xp INTEGER DEFAULT 0,
  entry_items TEXT[] DEFAULT '{}', -- Required items to enter
  max_visitors INTEGER DEFAULT 10,
  special_rules JSONB DEFAULT '{}'::jsonb,
  rewards JSONB DEFAULT '{}'::jsonb, -- Unique items, XP, achievements
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dream_dimensions_type ON dream_dimensions(dimension_type);
CREATE INDEX IF NOT EXISTS idx_dream_dimensions_base_hall ON dream_dimensions(base_hall_id);

-- Dream Sessions (User visits to dreams)
CREATE TABLE IF NOT EXISTS dream_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  dimension_id UUID REFERENCES dream_dimensions(id) ON DELETE CASCADE,
  entry_method TEXT CHECK (entry_method IN ('meditation', 'ritual', 'quest', 'random', 'portal')),
  session_start TIMESTAMPTZ DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  dream_narrative TEXT, -- AI-generated story of the dream
  discoveries TEXT[] DEFAULT '{}', -- What they found
  emotional_state_during TEXT,
  memory_created UUID, -- Links to user_memories
  brought_back_items TEXT[] DEFAULT '{}', -- Dream items that manifest
  dream_coherence DECIMAL(3,2), -- How logical/surreal it was
  lucidity_level DECIMAL(3,2), -- User's awareness level
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dream_sessions_user ON dream_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_dream_sessions_dimension ON dream_sessions(dimension_id);
CREATE INDEX IF NOT EXISTS idx_dream_sessions_created ON dream_sessions(created_at DESC);

-- ============================================
-- PREMIUM AI AGENT SUBSCRIPTIONS
-- ============================================

-- Personal AI Agents (Premium feature)
CREATE TABLE IF NOT EXISTS personal_ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('concierge', 'curator', 'guide', 'analyst', 'creator', 'companion')),
  personality_profile JSONB NOT NULL, -- User customizes personality
  learning_level TEXT DEFAULT 'basic' CHECK (learning_level IN ('basic', 'advanced', 'expert', 'master')),
  autonomy_level TEXT DEFAULT 'assisted' CHECK (autonomy_level IN ('assisted', 'autonomous', 'proactive')),
  memory_depth INTEGER DEFAULT 30, -- Days of memory retained
  conversation_style TEXT DEFAULT 'professional' CHECK (conversation_style IN ('professional', 'friendly', 'playful', 'mystical', 'formal')),
  specializations TEXT[] DEFAULT '{}', -- ['product_curation', 'emotional_support', 'quest_guidance']
  total_interactions INTEGER DEFAULT 0,
  user_satisfaction DECIMAL(2,1) DEFAULT 5.0,
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('basic', 'premium', 'elite')),
  monthly_fee DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, agent_name)
);

CREATE INDEX IF NOT EXISTS idx_personal_ai_agents_user ON personal_ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_ai_agents_type ON personal_ai_agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_personal_ai_agents_tier ON personal_ai_agents(subscription_tier);

-- Agent Task History (What personal agents have done)
CREATE TABLE IF NOT EXISTS personal_agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES personal_ai_agents(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  task_description TEXT,
  initiated_by TEXT CHECK (initiated_by IN ('user', 'agent', 'system')),
  outcome TEXT,
  user_feedback TEXT,
  value_generated DECIMAL(10,2), -- Estimated value of task
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_personal_agent_tasks_agent ON personal_agent_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_personal_agent_tasks_type ON personal_agent_tasks(task_type);

-- ============================================
-- WORLD EVENTS SYSTEM
-- ============================================

-- City-Wide Events (Festivals, eclipses, storms)
CREATE TABLE IF NOT EXISTS world_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('festival', 'eclipse', 'storm', 'celebration', 'disaster', 'convergence', 'portal_opening')),
  description TEXT,
  story_text TEXT,
  affected_locations TEXT[] DEFAULT '{}', -- Which halls/streets are affected
  atmosphere_changes JSONB NOT NULL,
  special_merchants TEXT[] DEFAULT '{}', -- Temporary vendors
  limited_items TEXT[] DEFAULT '{}',
  event_quests TEXT[] DEFAULT '{}',
  participant_count INTEGER DEFAULT 0,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT, -- 'monthly_full_moon', 'seasonal', 'yearly'
  ai_generated BOOLEAN DEFAULT FALSE,
  generated_by_agent TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_world_events_type ON world_events(event_type);
CREATE INDEX IF NOT EXISTS idx_world_events_status ON world_events(status);
CREATE INDEX IF NOT EXISTS idx_world_events_time ON world_events(start_time, end_time);

-- Event Participation
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES world_events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  participation_level TEXT DEFAULT 'attendee' CHECK (participation_level IN ('organizer', 'vendor', 'performer', 'attendee', 'observer')),
  contribution TEXT,
  rewards_earned JSONB DEFAULT '{}'::jsonb,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_participants_event ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user ON event_participants(user_id);

-- ============================================
-- WEATHER & ATMOSPHERIC EFFECTS
-- ============================================

-- Dynamic Weather System
CREATE TABLE IF NOT EXISTS weather_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_type TEXT NOT NULL CHECK (location_type IN ('hall', 'street', 'chapel', 'city_wide')),
  location_id UUID,
  weather_type TEXT NOT NULL CHECK (weather_type IN ('clear', 'cloudy', 'rain', 'storm', 'fog', 'snow', 'aurora', 'ethereal_mist')),
  intensity DECIMAL(2,1) DEFAULT 5.0, -- 0-10 scale
  visual_effects JSONB NOT NULL, -- Particle systems, filters, animations
  audio_effects JSONB NOT NULL, -- Ambient sounds
  mood_impact TEXT, -- How it affects user emotion
  duration_minutes INTEGER DEFAULT 60,
  active BOOLEAN DEFAULT TRUE,
  is_natural BOOLEAN DEFAULT TRUE, -- vs AI-generated/event-triggered
  triggered_by_event UUID REFERENCES world_events(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_weather_states_location ON weather_states(location_type, location_id);
CREATE INDEX IF NOT EXISTS idx_weather_states_active ON weather_states(active);

-- ============================================
-- MUSIC & SOUNDSCAPE GENERATION
-- ============================================

-- Generated Soundscapes (AI creates ambient music)
CREATE TABLE IF NOT EXISTS soundscapes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soundscape_name TEXT NOT NULL,
  location_type TEXT CHECK (location_type IN ('hall', 'street', 'chapel', 'event', 'personal')),
  location_id UUID,
  user_id TEXT, -- If personal
  generation_params JSONB NOT NULL, -- Mood, instruments, tempo, genre
  audio_url TEXT,
  duration_seconds INTEGER,
  mood_tags TEXT[] DEFAULT '{}',
  generated_by_ai BOOLEAN DEFAULT TRUE,
  generation_model TEXT,
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_soundscapes_location ON soundscapes(location_type, location_id);
CREATE INDEX IF NOT EXISTS idx_soundscapes_user ON soundscapes(user_id);
CREATE INDEX IF NOT EXISTS idx_soundscapes_play_count ON soundscapes(play_count DESC);

-- ============================================
-- NFT INTEGRATION (Web3 Layer)
-- ============================================

-- NFT Items (Blockchain-backed digital collectibles)
CREATE TABLE IF NOT EXISTS nft_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_id TEXT NOT NULL UNIQUE,
  contract_address TEXT NOT NULL,
  token_id TEXT NOT NULL,
  blockchain TEXT DEFAULT 'ethereum' CHECK (blockchain IN ('ethereum', 'polygon', 'solana', 'flow')),
  item_type TEXT CHECK (item_type IN ('memory', 'achievement', 'art', 'wearable', 'space', 'soundscape')),
  item_name TEXT NOT NULL,
  description TEXT,
  rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
  metadata_uri TEXT,
  image_url TEXT,
  model_3d_url TEXT,
  creator_storefront_id UUID REFERENCES creator_storefronts(id),
  original_owner TEXT,
  current_owner TEXT,
  mint_date TIMESTAMPTZ DEFAULT NOW(),
  last_transfer_date TIMESTAMPTZ,
  transfer_count INTEGER DEFAULT 0,
  utility JSONB DEFAULT '{}'::jsonb, -- What it unlocks in AI City
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nft_items_nft_id ON nft_items(nft_id);
CREATE INDEX IF NOT EXISTS idx_nft_items_owner ON nft_items(current_owner);
CREATE INDEX IF NOT EXISTS idx_nft_items_type ON nft_items(item_type);
CREATE INDEX IF NOT EXISTS idx_nft_items_rarity ON nft_items(rarity);

-- ============================================
-- ENTERPRISE API ACCESS
-- ============================================

-- API Keys for external systems
CREATE TABLE IF NOT EXISTS enterprise_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  api_secret TEXT NOT NULL,
  tier TEXT DEFAULT 'basic' CHECK (tier IN ('basic', 'professional', 'enterprise')),
  rate_limit_per_minute INTEGER DEFAULT 60,
  allowed_endpoints TEXT[] DEFAULT '{}',
  monthly_fee DECIMAL(10,2) NOT NULL,
  usage_this_month INTEGER DEFAULT 0,
  total_requests BIGINT DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_enterprise_api_keys_key ON enterprise_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_enterprise_api_keys_status ON enterprise_api_keys(status);

-- API Usage Logs
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES enterprise_api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  response_status INTEGER,
  response_time_ms INTEGER,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_key ON api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created ON api_usage_logs(created_at DESC);

-- Grant Permissions for new tables
GRANT ALL ON vendor_applications TO postgres, anon, authenticated;
GRANT ALL ON creator_storefronts TO postgres, anon, authenticated;
GRANT ALL ON creator_products TO postgres, anon, authenticated;
GRANT ALL ON creator_revenue TO postgres, anon, authenticated;
GRANT ALL ON guilds TO postgres, anon, authenticated;
GRANT ALL ON guild_members TO postgres, anon, authenticated;
GRANT ALL ON guild_activities TO postgres, anon, authenticated;
GRANT ALL ON dream_dimensions TO postgres, anon, authenticated;
GRANT ALL ON dream_sessions TO postgres, anon, authenticated;
GRANT ALL ON personal_ai_agents TO postgres, anon, authenticated;
GRANT ALL ON personal_agent_tasks TO postgres, anon, authenticated;
GRANT ALL ON world_events TO postgres, anon, authenticated;
GRANT ALL ON event_participants TO postgres, anon, authenticated;
GRANT ALL ON weather_states TO postgres, anon, authenticated;
GRANT ALL ON soundscapes TO postgres, anon, authenticated;
GRANT ALL ON nft_items TO postgres, anon, authenticated;
GRANT ALL ON enterprise_api_keys TO postgres, anon, authenticated;
GRANT ALL ON api_usage_logs TO postgres, anon, authenticated;
