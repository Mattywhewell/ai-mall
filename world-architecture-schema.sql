-- AI City World Architecture Schema
-- Layered spaces: Halls → Streets → Districts, with Chapels as intimate spaces

-- Halls Table (Grand Thematic Spaces)
CREATE TABLE IF NOT EXISTS halls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  theme TEXT NOT NULL CHECK (theme IN ('innovation', 'wellness', 'craft', 'motion', 'light')),
  atmosphere JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_spirit_id UUID,
  connected_streets TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add slug column if it doesn't exist
ALTER TABLE halls ADD COLUMN IF NOT EXISTS slug TEXT;

-- Add unique constraint separately
DO $$ 
BEGIN
  ALTER TABLE halls ADD CONSTRAINT halls_slug_unique UNIQUE (slug);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_halls_slug ON halls(slug);
CREATE INDEX IF NOT EXISTS idx_halls_theme ON halls(theme);

-- Streets Table (Navigational Pathways)
CREATE TABLE IF NOT EXISTS streets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
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

-- Add slug column if it doesn't exist
ALTER TABLE streets ADD COLUMN IF NOT EXISTS slug TEXT;

-- Add unique constraint separately
DO $$ 
BEGIN
  ALTER TABLE streets ADD CONSTRAINT streets_slug_unique UNIQUE (slug);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_streets_slug ON streets(slug);
CREATE INDEX IF NOT EXISTS idx_streets_hall ON streets(connects_hall_id);
CREATE INDEX IF NOT EXISTS idx_streets_popularity ON streets(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_streets_trending ON streets(trending);

-- Chapels Table (Intimate Micro-Environments)
CREATE TABLE IF NOT EXISTS chapels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
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

-- Add slug column if it doesn't exist
ALTER TABLE chapels ADD COLUMN IF NOT EXISTS slug TEXT;

-- Add unique constraint separately
DO $$ 
BEGIN
  ALTER TABLE chapels ADD CONSTRAINT chapels_slug_unique UNIQUE (slug);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_chapels_slug ON chapels(slug);
CREATE INDEX IF NOT EXISTS idx_chapels_emotion ON chapels(emotion);
CREATE INDEX IF NOT EXISTS idx_chapels_hall ON chapels(connected_to_hall);

-- AI Spirits Table (Multi-Agent Personalities)
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

-- User World Views Table (Personalized Rendering)
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

-- World Analytics Table
CREATE TABLE IF NOT EXISTS world_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_type TEXT NOT NULL CHECK (layer_type IN ('hall', 'street', 'chapel', 'district')),
  entity_id UUID NOT NULL,
  metric_type TEXT NOT NULL, -- 'view', 'time_spent', 'engagement', 'conversion'
  metric_value DECIMAL(10,2),
  user_id TEXT,
  session_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_world_analytics_layer ON world_analytics(layer_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_world_analytics_metric ON world_analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_world_analytics_recorded ON world_analytics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_world_analytics_user ON world_analytics(user_id);

-- Spirit Interactions Table
CREATE TABLE IF NOT EXISTS spirit_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spirit_id UUID REFERENCES ai_spirits(id) ON DELETE CASCADE,
  user_id TEXT,
  interaction_type TEXT NOT NULL, -- 'greeting', 'insight_request', 'navigation_help'
  context TEXT,
  response TEXT,
  user_sentiment TEXT, -- 'engaged', 'neutral', 'disengaged'
  time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spirit_interactions_spirit ON spirit_interactions(spirit_id);
CREATE INDEX IF NOT EXISTS idx_spirit_interactions_user ON spirit_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_spirit_interactions_created ON spirit_interactions(created_at DESC);

-- World Navigation Paths (Track user journeys)
CREATE TABLE IF NOT EXISTS world_navigation_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  path JSONB NOT NULL, -- Array of {layer, entity_id, timestamp}
  total_time INTEGER DEFAULT 0,
  conversion_occurred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_world_nav_paths_user ON world_navigation_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_world_nav_paths_session ON world_navigation_paths(session_id);
CREATE INDEX IF NOT EXISTS idx_world_nav_paths_conversion ON world_navigation_paths(conversion_occurred);

-- Atmospheric States Table (Time-based adaptations)
CREATE TABLE IF NOT EXISTS atmospheric_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  state_data JSONB NOT NULL, -- Colors, brightness, mood, etc.
  time_of_day TEXT, -- 'morning', 'afternoon', 'evening', 'night'
  season TEXT, -- 'spring', 'summer', 'fall', 'winter'
  user_count INTEGER DEFAULT 0, -- Current visitor count
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atmospheric_states_entity ON atmospheric_states(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_atmospheric_states_active ON atmospheric_states(active);

-- Subscription Layer Tables

-- Subscription Tiers (Base subscription plans)
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier_type TEXT NOT NULL CHECK (tier_type IN ('ritual_kit', 'district_box', 'ai_curated', 'seasonal', 'mystic', 'explorer')),
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  billing_frequency TEXT NOT NULL CHECK (billing_frequency IN ('monthly', 'quarterly', 'annual')),
  hall_affinity TEXT, -- Which hall theme this aligns with
  perks JSONB DEFAULT '[]'::jsonb, -- Array of perk descriptions
  ai_curation_level TEXT DEFAULT 'standard' CHECK (ai_curation_level IN ('standard', 'enhanced', 'master')),
  max_items_per_box INTEGER DEFAULT 5,
  customization_allowed BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add slug column if it doesn't exist (for existing tables)
ALTER TABLE subscription_tiers ADD COLUMN IF NOT EXISTS slug TEXT;

-- Add slug constraint separately (in case table already exists)
DO $$ 
BEGIN
  ALTER TABLE subscription_tiers ADD CONSTRAINT subscription_tiers_slug_unique UNIQUE (slug);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscription_tiers_slug ON subscription_tiers(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_type ON subscription_tiers(tier_type);
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_active ON subscription_tiers(active);

-- Ritual Calendar (Monthly themes and prompts)
CREATE TABLE IF NOT EXISTS ritual_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop NOT NULL constraints on columns from previous migrations
DO $$ 
BEGIN
  ALTER TABLE ritual_calendar ALTER COLUMN ritual_date DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE ritual_calendar ALTER COLUMN ritual_name DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

-- Add columns if they don't exist (for existing tables)
ALTER TABLE ritual_calendar ADD COLUMN IF NOT EXISTS month_year TEXT;
ALTER TABLE ritual_calendar ADD COLUMN IF NOT EXISTS theme_name TEXT;
ALTER TABLE ritual_calendar ADD COLUMN IF NOT EXISTS theme_description TEXT;
ALTER TABLE ritual_calendar ADD COLUMN IF NOT EXISTS moon_phase TEXT;
ALTER TABLE ritual_calendar ADD COLUMN IF NOT EXISTS seasonal_energy TEXT;
ALTER TABLE ritual_calendar ADD COLUMN IF NOT EXISTS ritual_focus TEXT;
ALTER TABLE ritual_calendar ADD COLUMN IF NOT EXISTS guided_practices TEXT[];
ALTER TABLE ritual_calendar ADD COLUMN IF NOT EXISTS affirmations TEXT[];
ALTER TABLE ritual_calendar ADD COLUMN IF NOT EXISTS journal_prompts TEXT[];
ALTER TABLE ritual_calendar ADD COLUMN IF NOT EXISTS connected_chapel_id UUID REFERENCES chapels(id);
ALTER TABLE ritual_calendar ADD COLUMN IF NOT EXISTS color_theme TEXT[] DEFAULT '{}';
ALTER TABLE ritual_calendar ADD COLUMN IF NOT EXISTS recommended_activities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE ritual_calendar ADD COLUMN IF NOT EXISTS community_intention TEXT;

-- Add unique constraint separately
DO $$ 
BEGIN
  ALTER TABLE ritual_calendar ADD CONSTRAINT ritual_calendar_month_year_unique UNIQUE (month_year);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_ritual_calendar_month ON ritual_calendar(month_year);
CREATE INDEX IF NOT EXISTS idx_ritual_calendar_focus ON ritual_calendar(ritual_focus);

-- Subscription Gift Codes
CREATE TABLE IF NOT EXISTS subscription_gift_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  duration_months INTEGER NOT NULL,
  purchaser_user_id TEXT,
  recipient_email TEXT,
  recipient_user_id TEXT,
  personal_message TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add tier_id column if it doesn't exist (for existing tables)
ALTER TABLE subscription_gift_codes ADD COLUMN IF NOT EXISTS tier_id UUID REFERENCES subscription_tiers(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_subscription_gift_codes_code ON subscription_gift_codes(code);
CREATE INDEX IF NOT EXISTS idx_subscription_gift_codes_status ON subscription_gift_codes(status);
CREATE INDEX IF NOT EXISTS idx_subscription_gift_codes_recipient ON subscription_gift_codes(recipient_user_id);

-- ============================================
-- ADVANCED INTERACTION SYSTEMS
-- ============================================

-- Natural Language Query Log
CREATE TABLE IF NOT EXISTS nl_query_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  query_text TEXT NOT NULL,
  detected_intent TEXT, -- 'search', 'navigate', 'ask', 'command', 'chat'
  intent_confidence DECIMAL(3,2),
  entities_extracted JSONB DEFAULT '{}'::jsonb, -- {product_types: [], locations: [], emotions: []}
  context JSONB DEFAULT '{}'::jsonb, -- Current location, recent actions
  response_generated TEXT,
  response_type TEXT, -- 'direct_answer', 'navigation', 'product_list', 'conversation'
  success BOOLEAN DEFAULT TRUE,
  fallback_triggered BOOLEAN DEFAULT FALSE,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nl_query_log_user ON nl_query_log(user_id);
CREATE INDEX IF NOT EXISTS idx_nl_query_log_session ON nl_query_log(session_id);
CREATE INDEX IF NOT EXISTS idx_nl_query_log_intent ON nl_query_log(detected_intent);
CREATE INDEX IF NOT EXISTS idx_nl_query_log_created ON nl_query_log(created_at DESC);

-- Conversation Sessions (Multi-turn dialogues)
CREATE TABLE IF NOT EXISTS conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  spirit_id UUID REFERENCES ai_spirits(id) ON DELETE SET NULL,
  conversation_context JSONB DEFAULT '{}'::jsonb, -- Accumulated context over turns
  message_count INTEGER DEFAULT 0,
  current_topic TEXT,
  user_satisfaction TEXT CHECK (user_satisfaction IN ('positive', 'neutral', 'negative')),
  session_goals TEXT[], -- ['find_product', 'learn_about_hall', 'get_recommendation']
  goals_achieved TEXT[] DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  session_duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_conversation_sessions_session_id ON conversation_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user ON conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_spirit ON conversation_sessions(spirit_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_active ON conversation_sessions(ended_at) WHERE ended_at IS NULL;

-- Conversation Messages
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'voice', 'image', 'action')),
  intent TEXT,
  emotional_tone TEXT,
  entities JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_session ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created ON conversation_messages(created_at DESC);

-- AI Agent Registry (For agent-to-agent communication)
CREATE TABLE IF NOT EXISTS ai_agent_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL UNIQUE,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('curator', 'guide', 'merchandiser', 'analyst', 'concierge', 'creator')),
  agent_name TEXT NOT NULL,
  capabilities TEXT[] DEFAULT '{}', -- ['product_recommendation', 'sentiment_analysis', 'image_generation']
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'idle', 'busy', 'offline')),
  current_task TEXT,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  communication_preferences JSONB DEFAULT '{}'::jsonb, -- Protocol, message format
  api_endpoint TEXT,
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_agent_registry_agent_id ON ai_agent_registry(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_registry_type ON ai_agent_registry(agent_type);
CREATE INDEX IF NOT EXISTS idx_ai_agent_registry_status ON ai_agent_registry(status);

-- Agent Communication Log
CREATE TABLE IF NOT EXISTS agent_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent_id TEXT NOT NULL,
  to_agent_id TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('request', 'response', 'notification', 'command', 'query')),
  payload JSONB NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'received', 'processed', 'failed')),
  response_data JSONB,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_communications_from ON agent_communications(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_communications_to ON agent_communications(to_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_communications_status ON agent_communications(status);
CREATE INDEX IF NOT EXISTS idx_agent_communications_created ON agent_communications(created_at DESC);

-- Agent Tasks & Orchestration
CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL UNIQUE,
  task_type TEXT NOT NULL, -- 'curate_box', 'analyze_sentiment', 'generate_recommendation'
  assigned_to_agent_id TEXT NOT NULL,
  requested_by TEXT, -- user_id or agent_id
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  input_data JSONB NOT NULL,
  output_data JSONB,
  progress_percent INTEGER DEFAULT 0,
  estimated_completion TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_task_id ON agent_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_assigned ON agent_tasks(assigned_to_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created ON agent_tasks(created_at DESC);

-- Gamification: User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('exploration', 'social', 'purchase', 'ritual', 'knowledge', 'collection')),
  description TEXT,
  icon_url TEXT,
  points_awarded INTEGER DEFAULT 0,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  unlock_criteria JSONB,
  progress_data JSONB DEFAULT '{}'::jsonb,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  displayed_publicly BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_user_achievements_rarity ON user_achievements(rarity);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked ON user_achievements(unlocked_at DESC);

-- Gamification: User Levels & Experience
CREATE TABLE IF NOT EXISTS user_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  next_level_threshold INTEGER DEFAULT 100,
  hall_mastery JSONB DEFAULT '{}'::jsonb, -- {hall_id: level}
  street_expertise JSONB DEFAULT '{}'::jsonb,
  titles_earned TEXT[] DEFAULT '{}', -- 'Mystic Explorer', 'Ritual Master', 'Tech Pioneer'
  active_title TEXT,
  badges TEXT[] DEFAULT '{}',
  total_achievements INTEGER DEFAULT 0,
  reputation_score DECIMAL(10,2) DEFAULT 0,
  lifetime_stats JSONB DEFAULT '{}'::jsonb, -- Total visits, purchases, time spent, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_progression_user ON user_progression(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progression_level ON user_progression(level DESC);
CREATE INDEX IF NOT EXISTS idx_user_progression_reputation ON user_progression(reputation_score DESC);

-- Gamification: Quests & Challenges
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id TEXT NOT NULL UNIQUE,
  quest_name TEXT NOT NULL,
  quest_type TEXT NOT NULL CHECK (quest_type IN ('daily', 'weekly', 'seasonal', 'story', 'challenge', 'hidden')),
  description TEXT,
  story_text TEXT,
  objectives JSONB NOT NULL, -- [{id: '1', description: 'Visit 3 halls', progress: 0, target: 3}]
  rewards JSONB NOT NULL, -- {experience: 50, items: [], badges: []}
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  duration_days INTEGER,
  requires_quest_ids TEXT[] DEFAULT '{}', -- Prerequisites
  connected_hall_id UUID REFERENCES halls(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quests_quest_id ON quests(quest_id);
CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(quest_type);
CREATE INDEX IF NOT EXISTS idx_quests_active ON quests(active);
CREATE INDEX IF NOT EXISTS idx_quests_dates ON quests(start_date, end_date);

-- User Quest Progress
CREATE TABLE IF NOT EXISTS user_quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned', 'failed')),
  objectives_progress JSONB DEFAULT '{}'::jsonb, -- Current progress on each objective
  completion_percent INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  rewards_claimed BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, quest_id)
);

CREATE INDEX IF NOT EXISTS idx_user_quest_progress_user ON user_quest_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_quest ON user_quest_progress(quest_id);
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_status ON user_quest_progress(status);

-- Leaderboards
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('experience', 'achievements', 'social_connections', 'rituals_completed', 'exploration', 'purchases')),
  time_period TEXT NOT NULL CHECK (time_period IN ('daily', 'weekly', 'monthly', 'all_time')),
  user_id TEXT NOT NULL,
  score DECIMAL(10,2) NOT NULL,
  rank INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboards_type_period ON leaderboards(leaderboard_type, time_period);
CREATE INDEX IF NOT EXISTS idx_leaderboards_user ON leaderboards(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_rank ON leaderboards(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboards_recorded ON leaderboards(recorded_at DESC);

-- AR/VR: Spatial Anchors (3D positions in virtual space)
CREATE TABLE IF NOT EXISTS spatial_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anchor_id TEXT NOT NULL UNIQUE,
  entity_type TEXT NOT NULL, -- 'hall', 'street', 'chapel', 'product', 'portal'
  entity_id UUID NOT NULL,
  position_x DECIMAL(10,4) NOT NULL,
  position_y DECIMAL(10,4) NOT NULL,
  position_z DECIMAL(10,4) NOT NULL,
  rotation_x DECIMAL(10,4) DEFAULT 0,
  rotation_y DECIMAL(10,4) DEFAULT 0,
  rotation_z DECIMAL(10,4) DEFAULT 0,
  scale DECIMAL(5,2) DEFAULT 1.0,
  anchor_type TEXT CHECK (anchor_type IN ('entrance', 'product_display', 'information', 'portal', 'decoration')),
  interaction_type TEXT, -- 'tap', 'gaze', 'gesture', 'proximity'
  metadata JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spatial_anchors_anchor_id ON spatial_anchors(anchor_id);
CREATE INDEX IF NOT EXISTS idx_spatial_anchors_entity ON spatial_anchors(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_spatial_anchors_active ON spatial_anchors(active);

-- AR/VR: 3D Model Assets
CREATE TABLE IF NOT EXISTS model_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id TEXT NOT NULL UNIQUE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  model_format TEXT NOT NULL CHECK (model_format IN ('gltf', 'glb', 'usdz', 'fbx', 'obj')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size_bytes INTEGER,
  polygon_count INTEGER,
  texture_urls TEXT[] DEFAULT '{}',
  animation_urls TEXT[] DEFAULT '{}',
  quality_level TEXT DEFAULT 'medium' CHECK (quality_level IN ('low', 'medium', 'high', 'ultra')),
  ar_compatible BOOLEAN DEFAULT TRUE,
  vr_compatible BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_assets_model_id ON model_assets(model_id);
CREATE INDEX IF NOT EXISTS idx_model_assets_entity ON model_assets(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_model_assets_format ON model_assets(model_format);

-- AR/VR: Immersive Sessions
CREATE TABLE IF NOT EXISTS immersive_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('ar', 'vr', 'mixed_reality')),
  device_type TEXT, -- 'quest', 'hololens', 'mobile_ar', 'web_xr'
  entry_point TEXT, -- Which hall/street they started in
  locations_visited TEXT[] DEFAULT '{}',
  interactions_count INTEGER DEFAULT 0,
  products_viewed_3d TEXT[] DEFAULT '{}',
  duration_seconds INTEGER,
  user_position_log JSONB DEFAULT '[]'::jsonb, -- Track movement through space
  interactions_log JSONB DEFAULT '[]'::jsonb,
  comfort_rating INTEGER, -- 1-5 for VR comfort
  session_quality TEXT CHECK (session_quality IN ('excellent', 'good', 'fair', 'poor')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_immersive_sessions_session_id ON immersive_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_immersive_sessions_user ON immersive_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_immersive_sessions_type ON immersive_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_immersive_sessions_started ON immersive_sessions(started_at DESC);

-- Voice Commands Log
CREATE TABLE IF NOT EXISTS voice_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  audio_duration_ms INTEGER,
  transcribed_text TEXT NOT NULL,
  detected_language TEXT DEFAULT 'en',
  confidence_score DECIMAL(3,2),
  intent TEXT,
  command_executed BOOLEAN DEFAULT FALSE,
  action_taken TEXT,
  response_audio_url TEXT,
  response_text TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_commands_user ON voice_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_session ON voice_commands(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_created ON voice_commands(created_at DESC);

-- Multi-Modal Interactions (Image, Voice, Text combined)
CREATE TABLE IF NOT EXISTS multimodal_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('image_search', 'voice_navigation', 'gesture_control', 'combined')),
  input_modalities TEXT[] NOT NULL, -- ['image', 'voice', 'text']
  image_url TEXT,
  image_analysis JSONB, -- Object detection, scene understanding
  voice_transcription TEXT,
  text_input TEXT,
  unified_intent TEXT,
  entities_detected JSONB DEFAULT '{}'::jsonb,
  action_taken TEXT,
  result_data JSONB,
  success BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_multimodal_interactions_user ON multimodal_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_multimodal_interactions_session ON multimodal_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_multimodal_interactions_type ON multimodal_interactions(interaction_type);

-- Emotional States (Extended from previous system)
CREATE TABLE IF NOT EXISTS emotional_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  emotion TEXT NOT NULL CHECK (emotion IN ('joy', 'calm', 'curiosity', 'contemplation', 'excitement', 'stress', 'melancholy', 'wonder', 'serenity')),
  intensity DECIMAL(3,2) NOT NULL,
  detected_from TEXT CHECK (detected_from IN ('behavior', 'explicit', 'inferred', 'voice', 'facial')),
  location TEXT,
  trigger_event TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emotional_states_user ON emotional_states(user_id);
CREATE INDEX IF NOT EXISTS idx_emotional_states_emotion ON emotional_states(emotion);
CREATE INDEX IF NOT EXISTS idx_emotional_states_created ON emotional_states(created_at DESC);

-- User Memory Garden (Extended from previous system)
CREATE TABLE IF NOT EXISTS user_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('visit', 'purchase', 'conversation', 'emotion', 'preference', 'achievement', 'discovery')),
  content JSONB NOT NULL,
  location TEXT,
  emotional_weight DECIMAL(3,2) DEFAULT 0,
  decay_rate DECIMAL(3,2) DEFAULT 0.5,
  memory_strength DECIMAL(3,2) DEFAULT 1.0,
  is_core_memory BOOLEAN DEFAULT FALSE,
  associated_quest_id TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_memories_user ON user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_type ON user_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_user_memories_core ON user_memories(is_core_memory);
CREATE INDEX IF NOT EXISTS idx_user_memories_strength ON user_memories(memory_strength DESC);

-- Social Presence (Real-time user location tracking)
CREATE TABLE IF NOT EXISTS social_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  location TEXT NOT NULL,
  activity TEXT CHECK (activity IN ('browsing', 'purchasing', 'conversing', 'idle', 'exploring', 'ritual')),
  public_profile JSONB NOT NULL,
  mood TEXT,
  open_to_chat BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '15 minutes'
);

CREATE INDEX IF NOT EXISTS idx_social_presence_location ON social_presence(location);
CREATE INDEX IF NOT EXISTS idx_social_presence_user ON social_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_social_presence_expires ON social_presence(expires_at);

-- Ghost Presences (Ethereal traces left behind)
CREATE TABLE IF NOT EXISTS ghost_presences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  location TEXT NOT NULL,
  action TEXT NOT NULL,
  emotion TEXT,
  message TEXT,
  fade_duration INTEGER DEFAULT 24, -- Hours until it fades
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_ghost_presences_location ON ghost_presences(location);
CREATE INDEX IF NOT EXISTS idx_ghost_presences_expires ON ghost_presences(expires_at);

-- Database Functions

-- Calculate street popularity
CREATE OR REPLACE FUNCTION calculate_street_popularity(street_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  score DECIMAL(5,2);
BEGIN
  SELECT 
    COALESCE(
      AVG(metric_value) * 10 +
      (COUNT(*) / 100.0),
      0
    )
  INTO score
  FROM world_analytics
  WHERE layer_type = 'street'
    AND entity_id = street_id
    AND metric_type = 'engagement'
    AND recorded_at > NOW() - INTERVAL '7 days';
  
  RETURN LEAST(score, 100.0);
END;
$$ LANGUAGE plpgsql;

-- Get trending streets
CREATE OR REPLACE FUNCTION get_trending_streets()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  popularity_score DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.slug,
    s.popularity_score
  FROM streets s
  WHERE s.trending = TRUE
  ORDER BY s.popularity_score DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Get user's preferred layer ordering
CREATE OR REPLACE FUNCTION get_personalized_layer_order(
  p_user_id TEXT,
  p_layer_type TEXT
)
RETURNS TABLE (entity_id UUID, affinity_score DECIMAL(5,2)) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wa.entity_id,
    SUM(wa.metric_value)::DECIMAL(5,2) AS affinity_score
  FROM world_analytics wa
  WHERE wa.user_id = p_user_id
    AND wa.layer_type = p_layer_type
    AND wa.recorded_at > NOW() - INTERVAL '30 days'
  GROUP BY wa.entity_id
  ORDER BY affinity_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Update street popularity automatically
CREATE OR REPLACE FUNCTION update_street_popularity()
RETURNS void AS $$
DECLARE
  street_record RECORD;
  new_score DECIMAL(5,2);
BEGIN
  FOR street_record IN SELECT id FROM streets LOOP
    new_score := calculate_street_popularity(street_record.id);
    
    UPDATE streets
    SET 
      popularity_score = new_score,
      trending = (new_score > 70),
      updated_at = NOW()
    WHERE id = street_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function moved to after table creation

-- Functions moved to after table creation

-- Award achievement to user
CREATE OR REPLACE FUNCTION award_achievement(
  p_user_id TEXT,
  p_achievement_id TEXT,
  p_achievement_name TEXT,
  p_achievement_type TEXT,
  p_points INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  already_exists BOOLEAN;
BEGIN
  -- Check if already unlocked
  SELECT EXISTS (
    SELECT 1 FROM user_achievements
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id
  ) INTO already_exists;
  
  IF already_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Insert achievement
  INSERT INTO user_achievements (user_id, achievement_id, achievement_name, achievement_type, points_awarded)
  VALUES (p_user_id, p_achievement_id, p_achievement_name, p_achievement_type, p_points);
  
  -- Update user progression
  UPDATE user_progression
  SET 
    experience_points = experience_points + p_points,
    total_achievements = total_achievements + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Check for level up
  PERFORM check_level_up(p_user_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Check and process level up
CREATE OR REPLACE FUNCTION check_level_up(p_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  current_xp INTEGER;
  current_level INTEGER;
  threshold INTEGER;
  leveled_up BOOLEAN := FALSE;
BEGIN
  SELECT experience_points, level, next_level_threshold
  INTO current_xp, current_level, threshold
  FROM user_progression
  WHERE user_id = p_user_id;
  
  WHILE current_xp >= threshold LOOP
    current_level := current_level + 1;
    threshold := threshold + (current_level * 50); -- Increasing threshold
    leveled_up := TRUE;
  END LOOP;
  
  IF leveled_up THEN
    UPDATE user_progression
    SET 
      level = current_level,
      next_level_threshold = threshold,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN leveled_up;
END;
$$ LANGUAGE plpgsql;

-- Update quest progress
CREATE OR REPLACE FUNCTION update_quest_progress(
  p_user_id TEXT,
  p_quest_id TEXT,
  p_objective_id TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  current_progress JSONB;
  quest_objectives JSONB;
  objective JSONB;
  new_progress INTEGER;
  target INTEGER;
  all_completed BOOLEAN := TRUE;
BEGIN
  -- Get quest objectives
  SELECT objectives INTO quest_objectives
  FROM quests
  WHERE quest_id = p_quest_id;
  
  -- Get or create user quest progress
  INSERT INTO user_quest_progress (user_id, quest_id, objectives_progress)
  VALUES (p_user_id, p_quest_id, '{}'::jsonb)
  ON CONFLICT (user_id, quest_id) DO NOTHING;
  
  -- Get current progress
  SELECT objectives_progress INTO current_progress
  FROM user_quest_progress
  WHERE user_id = p_user_id AND quest_id = p_quest_id;
  
  -- Update specific objective
  FOR objective IN SELECT * FROM jsonb_array_elements(quest_objectives)
  LOOP
    IF objective->>'id' = p_objective_id THEN
      new_progress := COALESCE((current_progress->>p_objective_id)::INTEGER, 0) + p_increment;
      target := (objective->>'target')::INTEGER;
      new_progress := LEAST(new_progress, target);
      
      current_progress := jsonb_set(
        current_progress,
        ARRAY[p_objective_id],
        to_jsonb(new_progress)
      );
    END IF;
  END LOOP;
  
  -- Check if all objectives complete
  FOR objective IN SELECT * FROM jsonb_array_elements(quest_objectives)
  LOOP
    IF COALESCE((current_progress->>(objective->>'id'))::INTEGER, 0) < (objective->>'target')::INTEGER THEN
      all_completed := FALSE;
    END IF;
  END LOOP;
  
  -- Update progress
  UPDATE user_quest_progress
  SET 
    objectives_progress = current_progress,
    completion_percent = CASE 
      WHEN all_completed THEN 100
      ELSE (SELECT AVG(
        COALESCE((current_progress->>(obj->>'id'))::INTEGER, 0)::DECIMAL / 
        (obj->>'target')::INTEGER * 100
      ) FROM jsonb_array_elements(quest_objectives) obj)::INTEGER
    END,
    status = CASE WHEN all_completed THEN 'completed' ELSE status END,
    completed_at = CASE WHEN all_completed THEN NOW() ELSE completed_at END
  WHERE user_id = p_user_id AND quest_id = p_quest_id;
  
  RETURN all_completed;
END;
$$ LANGUAGE plpgsql;

-- Get active social presence in location
CREATE OR REPLACE FUNCTION get_active_presence_in_location(p_location TEXT)
RETURNS TABLE (
  user_id TEXT,
  activity TEXT,
  mood TEXT,
  profile JSONB,
  open_to_chat BOOLEAN
) AS $$
BEGIN
  -- Clean up expired presences
  DELETE FROM social_presence WHERE expires_at < NOW();
  
  -- Return active users
  RETURN QUERY
  SELECT 
    sp.user_id,
    sp.activity,
    sp.mood,
    sp.public_profile,
    sp.open_to_chat
  FROM social_presence sp
  WHERE sp.location = p_location
    AND sp.last_seen > NOW() - INTERVAL '5 minutes'
  ORDER BY sp.last_seen DESC;
END;
$$ LANGUAGE plpgsql;

-- Update user memory strength (decay over time)
CREATE OR REPLACE FUNCTION decay_memories()
RETURNS void AS $$
BEGIN
  UPDATE user_memories
  SET memory_strength = GREATEST(
    0.1,
    memory_strength * EXP(-decay_rate * EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0)
  )
  WHERE is_core_memory = FALSE
    AND memory_strength > 0.1;
END;
$$ LANGUAGE plpgsql;

-- Analyze NL query patterns for a user
CREATE OR REPLACE FUNCTION get_user_query_insights(p_user_id TEXT)
RETURNS TABLE (
  common_intent TEXT,
  intent_count BIGINT,
  avg_confidence DECIMAL(3,2),
  success_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    nlq.detected_intent,
    COUNT(*) as intent_count,
    AVG(nlq.intent_confidence)::DECIMAL(3,2),
    (COUNT(*) FILTER (WHERE nlq.success = TRUE)::DECIMAL / COUNT(*)::DECIMAL * 100)::DECIMAL(5,2)
  FROM nl_query_log nlq
  WHERE nlq.user_id = p_user_id
    AND nlq.created_at > NOW() - INTERVAL '30 days'
  GROUP BY nlq.detected_intent
  ORDER BY intent_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Calculate user engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(p_user_id TEXT)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  score DECIMAL(5,2) := 0;
  days_active INTEGER;
  avg_session_time DECIMAL(10,2);
BEGIN
  -- Days active in last 30 days
  SELECT COUNT(DISTINCT DATE(created_at))
  INTO days_active
  FROM world_analytics
  WHERE user_id = p_user_id
    AND recorded_at > NOW() - INTERVAL '30 days';
  
  score := score + (days_active * 2);
  
  -- Average session time
  SELECT AVG(total_time)
  INTO avg_session_time
  FROM world_navigation_paths
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '30 days';
  
  score := score + LEAST(50, COALESCE(avg_session_time, 0) / 60.0);
  
  -- Achievements
  SELECT COUNT(*) * 5
  INTO days_active
  FROM user_achievements
  WHERE user_id = p_user_id;
  
  score := score + days_active;
  
  RETURN LEAST(100.0, score);
END;
$$ LANGUAGE plpgsql;

-- Recommend next quest based on user profile
CREATE OR REPLACE FUNCTION recommend_next_quest(p_user_id TEXT)
RETURNS TABLE (
  quest_id TEXT,
  quest_name TEXT,
  match_score DECIMAL(3,2),
  reason TEXT
) AS $$
DECLARE
  user_level INTEGER;
  completed_quests TEXT[];
BEGIN
  -- Get user info
  SELECT level INTO user_level
  FROM user_progression
  WHERE user_id = p_user_id;
  
  SELECT ARRAY_AGG(quest_id) INTO completed_quests
  FROM user_quest_progress
  WHERE user_id = p_user_id AND status = 'completed';
  
  -- Recommend quests
  RETURN QUERY
  SELECT 
    q.quest_id,
    q.quest_name,
    (
      CASE 
        WHEN q.difficulty = 'easy' AND user_level < 5 THEN 0.8
        WHEN q.difficulty = 'medium' AND user_level BETWEEN 5 AND 15 THEN 0.9
        WHEN q.difficulty = 'hard' AND user_level > 15 THEN 0.85
        ELSE 0.5
      END +
      CASE 
        WHEN q.quest_type = 'daily' THEN 0.1
        WHEN q.quest_type = 'story' THEN 0.15
        ELSE 0.05
      END
    )::DECIMAL(3,2) AS match_score,
    'Based on your level ' || user_level::TEXT || ' and preferences' AS reason
  FROM quests q
  WHERE q.active = TRUE
    AND NOT (q.quest_id = ANY(COALESCE(completed_quests, ARRAY[]::TEXT[])))
    AND (q.start_date IS NULL OR q.start_date <= CURRENT_DATE)
    AND (q.end_date IS NULL OR q.end_date >= CURRENT_DATE)
  ORDER BY match_score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Seed Initial Data

-- Seed Halls
INSERT INTO halls (name, slug, theme, atmosphere) VALUES
('The Luminous Nexus', 'luminous-nexus', 'innovation', '{"mood": "electric", "color_palette": ["#3B82F6", "#8B5CF6", "#EC4899"], "ambient_text": "Where future meets imagination", "lighting_style": "bright", "time_of_day_adaptation": true}'::jsonb),
('Garden of Serenity', 'garden-serenity', 'wellness', '{"mood": "peaceful", "color_palette": ["#10B981", "#14B8A6", "#06B6D4"], "ambient_text": "Breathe, restore, flourish", "lighting_style": "warm", "time_of_day_adaptation": true}'::jsonb),
('Makers Sanctuary', 'makers-sanctuary', 'craft', '{"mood": "creative", "color_palette": ["#F59E0B", "#EF4444", "#DC2626"], "ambient_text": "Hands create what hearts imagine", "lighting_style": "warm", "time_of_day_adaptation": false}'::jsonb),
('Kinetic Plaza', 'kinetic-plaza', 'motion', '{"mood": "energetic", "color_palette": ["#EF4444", "#F97316", "#FB923C"], "ambient_text": "Movement is life in motion", "lighting_style": "bright", "time_of_day_adaptation": true}'::jsonb),
('Cathedral of Light', 'cathedral-light', 'light', '{"mood": "ethereal", "color_palette": ["#FEF3C7", "#FDE68A", "#FFFFFF"], "ambient_text": "Illumination beyond sight", "lighting_style": "bright", "time_of_day_adaptation": true}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Seed Streets
INSERT INTO streets (name, slug, personality, atmosphere_tags, popularity_score, connects_hall_id) VALUES
('Neon Boulevard', 'neon-boulevard', 'neon', ARRAY['vibrant', 'electric', 'modern'], 85.5, (SELECT id FROM halls WHERE slug = 'luminous-nexus')),
('Artisan Row', 'artisan-row', 'artisan', ARRAY['handcrafted', 'authentic', 'timeless'], 72.3, (SELECT id FROM halls WHERE slug = 'makers-sanctuary')),
('Wellness Way', 'wellness-way', 'wellness', ARRAY['calm', 'natural', 'healing'], 68.7, (SELECT id FROM halls WHERE slug = 'garden-serenity')),
('Tech Corridor', 'tech-corridor', 'tech', ARRAY['innovative', 'sleek', 'forward'], 91.2, (SELECT id FROM halls WHERE slug = 'luminous-nexus')),
('Vintage Lane', 'vintage-lane', 'vintage', ARRAY['nostalgic', 'curated', 'classic'], 64.1, (SELECT id FROM halls WHERE slug = 'makers-sanctuary'))
ON CONFLICT (slug) DO NOTHING;

-- Seed Chapels
INSERT INTO chapels (name, slug, emotion, micro_story, symbolism, ai_insight, connected_to_hall) VALUES
('Chapel of Quiet Thoughts', 'quiet-thoughts', 'contemplation', 'A space where whispers become wisdom, and silence speaks volumes. Here, the mind finds clarity in stillness.', ARRAY['reflection', 'introspection', 'clarity'], 'In stillness, we discover what noise conceals.', (SELECT id FROM halls WHERE slug = 'garden-serenity')),
('Alcove of Wonder', 'alcove-wonder', 'wonder', 'Where curiosity blooms like flowers in spring. Every corner holds a question, every shadow suggests a story yet untold.', ARRAY['curiosity', 'discovery', 'mystery'], 'Wonder is the beginning of all wisdom.', (SELECT id FROM halls WHERE slug = 'cathedral-light')),
('Sanctuary of Joy', 'sanctuary-joy', 'joy', 'Laughter echoes through these walls like music. Here, happiness is not pursued—it simply is.', ARRAY['celebration', 'light', 'gratitude'], 'Joy shared multiplies infinitely.', (SELECT id FROM halls WHERE slug = 'kinetic-plaza')),
('Chamber of Mysteries', 'chamber-mysteries', 'mystery', 'Shadows dance with secrets here. Not all that enters is meant to be fully understood, only deeply felt.', ARRAY['enigma', 'depth', 'unknown'], 'Mystery invites us to look deeper.', (SELECT id FROM halls WHERE slug = 'makers-sanctuary')),
('Haven of Serenity', 'haven-serenity', 'serenity', 'Peace flows like water over stones. Time moves differently here—gentle, unhurried, eternal.', ARRAY['peace', 'tranquility', 'balance'], 'Serenity is found within, not without.', (SELECT id FROM halls WHERE slug = 'garden-serenity'))
ON CONFLICT (slug) DO NOTHING;

-- Seed Subscription Tiers
INSERT INTO subscription_tiers (name, slug, tier_type, description, base_price, billing_frequency, hall_affinity, perks, ai_curation_level, max_items_per_box) VALUES
('Mystic Ritual Kit', 'mystic-ritual', 'ritual_kit', 'Monthly curated tools for sacred practices: crystals, candles, incense, ritual objects aligned with lunar cycles and seasonal energies.', 49.99, 'monthly', 'light', '["Moon phase tracking", "Ritual guide booklet", "Meditation audio", "Community circle access"]'::jsonb, 'enhanced', 5),
('Neon District Box', 'neon-district', 'district_box', 'Cutting-edge finds from Tech Corridor and Neon Boulevard: gadgets, design objects, limited drops from innovation makers.', 79.99, 'monthly', 'innovation', '["Early access to maker launches", "District spotlight stories", "Exclusive collaborations", "Digital collectibles"]'::jsonb, 'enhanced', 6),
('AI Curator''s Choice', 'ai-curated', 'ai_curated', 'Let our AI deeply learn your tastes and surprise you with perfect matches across all districts. The more you rate, the smarter it gets.', 89.99, 'monthly', NULL, '["Highest personalization", "Cross-district curation", "Surprise & delight factor", "Priority item requests"]'::jsonb, 'master', 7),
('Seasonal Spirits Collection', 'seasonal-spirits', 'seasonal', 'Quarterly themed boxes celebrating solstices and equinoxes with artisan goods, seasonal rituals, and limited-edition collaborations.', 149.99, 'quarterly', 'craft', '["Seasonal ritual guide", "Artisan maker interviews", "Limited-edition items", "Collector packaging"]'::jsonb, 'enhanced', 8),
('Wellness Way Essentials', 'wellness-essentials', 'district_box', 'Monthly self-care treasures from Wellness Way: organic skincare, herbal remedies, mindfulness tools, and nourishment for body & spirit.', 64.99, 'monthly', 'wellness', '["Wellness guide", "Herbal remedy cards", "Breathwork audio", "Nutrition tips"]'::jsonb, 'standard', 5),
('Artisan Explorer', 'artisan-explorer', 'district_box', 'Discover the stories behind handmade treasures from Makers Sanctuary and Artisan Row: pottery, textiles, small-batch goods.', 69.99, 'monthly', 'craft', '["Maker story cards", "Behind-the-craft videos", "Technique tutorials", "Artisan community access"]'::jsonb, 'standard', 6)
ON CONFLICT (slug) DO NOTHING;

-- Seed Ritual Calendar
INSERT INTO ritual_calendar (month_year, theme_name, theme_description, moon_phase, seasonal_energy, ritual_focus, guided_practices, affirmations, journal_prompts, color_theme) VALUES
('2026-01', 'Winter''s Wisdom', 'Embrace the quiet introspection of winter''s deep rest. Turn inward, reflect on the year past, and plant seeds of intention for the cycle ahead.', 'new_moon', 'Restorative, contemplative, crystalline clarity', 'reflect', 
 ARRAY['Daily meditation at sunrise', 'Journaling by candlelight', 'Gentle movement practice', 'Moon gazing ritual'],
 ARRAY['I honor my need for rest', 'Clarity emerges from stillness', 'I trust the wisdom of winter'],
 ARRAY['What am I ready to release from last year?', 'What dreams are hibernating within me?', 'How can I create more stillness in my days?'],
 ARRAY['#E0F2FE', '#0C4A6E', '#F8FAFC', '#64748B']),
('2026-02', 'Spark of Renewal', 'As days lengthen, kindle the first flames of new beginnings. What spark within you is ready to be tended?', 'waxing', 'Awakening, gentle momentum, hopeful', 'manifest',
 ARRAY['Morning intention setting', 'Creative expression time', 'Nature connection walks', 'Fire ceremony'],
 ARRAY['I am a keeper of sacred fire', 'My dreams are taking shape', 'I trust my creative spark'],
 ARRAY['What is ready to be born through me?', 'Where do I feel creative energy stirring?', 'What small action can I take today?'],
 ARRAY['#FED7AA', '#F97316', '#FBBF24', '#FEF3C7'])
ON CONFLICT (month_year) DO NOTHING;

-- Old seed data removed

-- Old box items seed data removed

-- Grant Permissions
GRANT ALL ON halls TO postgres, anon, authenticated;
GRANT ALL ON streets TO postgres, anon, authenticated;
GRANT ALL ON chapels TO postgres, anon, authenticated;
GRANT ALL ON ai_spirits TO postgres, anon, authenticated;
GRANT ALL ON user_world_views TO postgres, anon, authenticated;
GRANT ALL ON world_analytics TO postgres, anon, authenticated;
GRANT ALL ON spirit_interactions TO postgres, anon, authenticated;
GRANT ALL ON world_navigation_paths TO postgres, anon, authenticated;
GRANT ALL ON atmospheric_states TO postgres, anon, authenticated;
GRANT ALL ON subscription_tiers TO postgres, anon, authenticated;
GRANT ALL ON user_subscriptions TO postgres, anon, authenticated;
GRANT ALL ON ai_curation_profiles TO postgres, anon, authenticated;
GRANT ALL ON ritual_calendar TO postgres, anon, authenticated;
GRANT ALL ON subscription_gift_codes TO postgres, anon, authenticated;

-- Advanced Interaction Systems Permissions
GRANT ALL ON nl_query_log TO postgres, anon, authenticated;
GRANT ALL ON conversation_sessions TO postgres, anon, authenticated;
GRANT ALL ON conversation_messages TO postgres, anon, authenticated;
GRANT ALL ON ai_agent_registry TO postgres, anon, authenticated;
GRANT ALL ON agent_communications TO postgres, anon, authenticated;
GRANT ALL ON agent_tasks TO postgres, anon, authenticated;
GRANT ALL ON user_achievements TO postgres, anon, authenticated;
GRANT ALL ON user_progression TO postgres, anon, authenticated;
GRANT ALL ON quests TO postgres, anon, authenticated;
GRANT ALL ON user_quest_progress TO postgres, anon, authenticated;
GRANT ALL ON leaderboards TO postgres, anon, authenticated;
GRANT ALL ON spatial_anchors TO postgres, anon, authenticated;
GRANT ALL ON model_assets TO postgres, anon, authenticated;
GRANT ALL ON immersive_sessions TO postgres, anon, authenticated;
GRANT ALL ON voice_commands TO postgres, anon, authenticated;
GRANT ALL ON multimodal_interactions TO postgres, anon, authenticated;
GRANT ALL ON emotional_states TO postgres, anon, authenticated;
GRANT ALL ON user_memories TO postgres, anon, authenticated;
GRANT ALL ON social_presence TO postgres, anon, authenticated;
GRANT ALL ON ghost_presences TO postgres, anon, authenticated;

-- ============================================
-- AI CITY v5.0 EVOLUTION SCHEMA
-- "The Awakening" - Creator Economy, Guilds, Dreams, Premium AI
-- Added: January 4, 2026
-- ============================================

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
  brand_identity JSONB NOT NULL,
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
  badges TEXT[] DEFAULT '{}',
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
  hall_affinity TEXT,
  member_count INTEGER DEFAULT 1,
  max_members INTEGER DEFAULT 100,
  privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'invite_only')),
  entry_requirements JSONB DEFAULT '{}'::jsonb,
  guild_perks JSONB DEFAULT '[]'::jsonb,
  guild_hall_id UUID,
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
  atmosphere_shift JSONB NOT NULL,
  time_dilation DECIMAL(3,2) DEFAULT 1.0,
  emotional_intensity DECIMAL(2,1) DEFAULT 1.0,
  available_hours TEXT[] DEFAULT '{}',
  moon_phase_requirement TEXT,
  entry_cost_xp INTEGER DEFAULT 0,
  entry_items TEXT[] DEFAULT '{}',
  max_visitors INTEGER DEFAULT 10,
  special_rules JSONB DEFAULT '{}'::jsonb,
  rewards JSONB DEFAULT '{}'::jsonb,
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
  dream_narrative TEXT,
  discoveries TEXT[] DEFAULT '{}',
  emotional_state_during TEXT,
  memory_created UUID,
  brought_back_items TEXT[] DEFAULT '{}',
  dream_coherence DECIMAL(3,2),
  lucidity_level DECIMAL(3,2),
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
  personality_profile JSONB NOT NULL,
  learning_level TEXT DEFAULT 'basic' CHECK (learning_level IN ('basic', 'advanced', 'expert', 'master')),
  autonomy_level TEXT DEFAULT 'assisted' CHECK (autonomy_level IN ('assisted', 'autonomous', 'proactive')),
  memory_depth INTEGER DEFAULT 30,
  conversation_style TEXT DEFAULT 'professional' CHECK (conversation_style IN ('professional', 'friendly', 'playful', 'mystical', 'formal')),
  specializations TEXT[] DEFAULT '{}',
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
  value_generated DECIMAL(10,2),
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
  affected_locations TEXT[] DEFAULT '{}',
  atmosphere_changes JSONB NOT NULL,
  special_merchants TEXT[] DEFAULT '{}',
  limited_items TEXT[] DEFAULT '{}',
  event_quests TEXT[] DEFAULT '{}',
  participant_count INTEGER DEFAULT 0,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT,
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
  intensity DECIMAL(2,1) DEFAULT 5.0,
  visual_effects JSONB NOT NULL,
  audio_effects JSONB NOT NULL,
  mood_impact TEXT,
  duration_minutes INTEGER DEFAULT 60,
  active BOOLEAN DEFAULT TRUE,
  is_natural BOOLEAN DEFAULT TRUE,
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
  user_id TEXT,
  generation_params JSONB NOT NULL,
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
  utility JSONB DEFAULT '{}'::jsonb,
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

-- Grant Permissions for v5.0 tables
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

-- ============================================
-- CREATOR REVIEWS & RATINGS SYSTEM
-- ============================================

-- Product Reviews
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES creator_products(id) ON DELETE CASCADE,
  storefront_id UUID NOT NULL REFERENCES creator_storefronts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_title TEXT,
  review_text TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  response_from_creator TEXT,
  response_date TIMESTAMPTZ,
  status TEXT DEFAULT 'published' CHECK (status IN ('pending', 'published', 'flagged', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_storefront ON product_reviews(storefront_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);

-- Storefront Reviews (Overall creator rating)
CREATE TABLE IF NOT EXISTS storefront_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id UUID NOT NULL REFERENCES creator_storefronts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  categories JSONB DEFAULT '{}'::jsonb,
  helpful_count INTEGER DEFAULT 0,
  response_from_creator TEXT,
  response_date TIMESTAMPTZ,
  status TEXT DEFAULT 'published' CHECK (status IN ('pending', 'published', 'flagged', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(storefront_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_storefront_reviews_storefront ON storefront_reviews(storefront_id);
CREATE INDEX IF NOT EXISTS idx_storefront_reviews_user ON storefront_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_storefront_reviews_rating ON storefront_reviews(rating);

-- Review Helpfulness (Users can mark reviews helpful)
CREATE TABLE IF NOT EXISTS review_helpfulness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL,
  review_type TEXT NOT NULL CHECK (review_type IN ('product', 'storefront')),
  user_id TEXT NOT NULL,
  helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, review_type, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_helpfulness_review ON review_helpfulness(review_id, review_type);
CREATE INDEX IF NOT EXISTS idx_review_helpfulness_user ON review_helpfulness(user_id);

-- ============================================
-- CREATOR DISCOVERY & BROWSE
-- ============================================

-- Creator Collections (Curated groups)
CREATE TABLE IF NOT EXISTS creator_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  curator_id TEXT,
  collection_type TEXT CHECK (collection_type IN ('editorial', 'trending', 'seasonal', 'category', 'community')),
  storefront_ids UUID[] DEFAULT '{}',
  cover_image TEXT,
  tags TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_collections_slug ON creator_collections(slug);
CREATE INDEX IF NOT EXISTS idx_creator_collections_type ON creator_collections(collection_type);
CREATE INDEX IF NOT EXISTS idx_creator_collections_featured ON creator_collections(featured);

-- Creator Follows (Users follow creators)
CREATE TABLE IF NOT EXISTS creator_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  storefront_id UUID NOT NULL REFERENCES creator_storefronts(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, storefront_id)
);

CREATE INDEX IF NOT EXISTS idx_creator_follows_user ON creator_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_follows_storefront ON creator_follows(storefront_id);

-- ============================================
-- MESSAGING SYSTEM
-- ============================================

-- Conversations (Between customers and creators)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_user_id TEXT NOT NULL,
  storefront_id UUID NOT NULL REFERENCES creator_storefronts(id) ON DELETE CASCADE,
  subject TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived')),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  unread_count_customer INTEGER DEFAULT 0,
  unread_count_creator INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_user_id, storefront_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_storefront ON conversations(storefront_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_user_id TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'creator')),
  message_text TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- ============================================
-- NOTIFICATIONS SYSTEM
-- ============================================

-- User Notifications
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'new_sale', 'new_review', 'new_message', 'new_follower', 
    'application_approved', 'application_rejected', 'payout_processed',
    'product_featured', 'low_inventory', 'milestone_reached'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created ON user_notifications(created_at DESC);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  notification_types JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- Grant Permissions
GRANT ALL ON product_reviews TO postgres, anon, authenticated;
GRANT ALL ON storefront_reviews TO postgres, anon, authenticated;
GRANT ALL ON review_helpfulness TO postgres, anon, authenticated;
GRANT ALL ON creator_collections TO postgres, anon, authenticated;
GRANT ALL ON creator_follows TO postgres, anon, authenticated;
GRANT ALL ON conversations TO postgres, anon, authenticated;
GRANT ALL ON messages TO postgres, anon, authenticated;
GRANT ALL ON user_notifications TO postgres, anon, authenticated;
GRANT ALL ON notification_preferences TO postgres, anon, authenticated;

-- =====================================================
-- AI SHOPPING CONCIERGE SYSTEM
-- Personal AI agents that learn user preferences
-- =====================================================

-- AI Shopping Agents (Personal AI for each user)
CREATE TABLE IF NOT EXISTS shopping_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  agent_name TEXT NOT NULL,
  personality TEXT DEFAULT 'helpful',
  avatar_url TEXT,
  voice_id TEXT,

  -- Learning Data
  style_preferences JSONB DEFAULT '{}'::jsonb,
  budget_range JSONB DEFAULT '{}'::jsonb,
  favorite_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  disliked_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  size_preferences JSONB DEFAULT '{}'::jsonb,
  color_preferences TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Behavior Tracking
  total_interactions INTEGER DEFAULT 0,
  successful_recommendations INTEGER DEFAULT 0,
  recommendation_accuracy DECIMAL(3,2) DEFAULT 0.00,

  -- Capabilities
  can_auto_purchase BOOLEAN DEFAULT false,
  spending_limit DECIMAL(10,2),
  active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()

  -- Removed: CONSTRAINT fk_agent_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_shopping_agents_user ON shopping_agents(user_id);
CREATE INDEX idx_shopping_agents_active ON shopping_agents(active) WHERE active = true;

-- Agent Conversations (Chat history with AI)
CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'agent', 'system')),
  message TEXT NOT NULL,
  
  -- Context
  context JSONB DEFAULT '{}'::jsonb,
  products_mentioned UUID[] DEFAULT ARRAY[]::UUID[],
  intent TEXT,
  sentiment TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_conv_agent FOREIGN KEY (agent_id) REFERENCES shopping_agents(id) ON DELETE CASCADE
  -- Removed: CONSTRAINT fk_conv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_agent_conversations_agent ON agent_conversations(agent_id);
CREATE INDEX idx_agent_conversations_created ON agent_conversations(created_at DESC);

-- Agent Recommendations (What the AI suggests)
CREATE TABLE IF NOT EXISTS agent_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  product_id UUID NOT NULL,
  
  reason TEXT NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL,
  personalization_factors JSONB DEFAULT '{}'::jsonb,
  
  -- Outcome Tracking
  viewed BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  purchased BOOLEAN DEFAULT false,
  dismissed BOOLEAN DEFAULT false,
  feedback TEXT,
  
  recommended_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  
  CONSTRAINT fk_rec_agent FOREIGN KEY (agent_id) REFERENCES shopping_agents(id) ON DELETE CASCADE,
  -- Removed: CONSTRAINT fk_rec_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_rec_product FOREIGN KEY (product_id) REFERENCES creator_products(id) ON DELETE CASCADE
);

CREATE INDEX idx_agent_recommendations_agent ON agent_recommendations(agent_id);
CREATE INDEX idx_agent_recommendations_user ON agent_recommendations(user_id);
CREATE INDEX idx_agent_recommendations_product ON agent_recommendations(product_id);
CREATE INDEX idx_agent_recommendations_pending ON agent_recommendations(viewed) WHERE viewed = false;

-- Agent Learning Events (How AI improves over time)
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

CREATE INDEX idx_agent_learning_agent ON agent_learning_events(agent_id);
CREATE INDEX idx_agent_learning_type ON agent_learning_events(event_type);
CREATE INDEX idx_agent_learning_created ON agent_learning_events(created_at DESC);

-- =====================================================
-- LIVE SHOPPING EVENTS
-- Real-time interactive shopping experiences
-- =====================================================

-- Live Events (Scheduled shopping shows)
CREATE TABLE IF NOT EXISTS live_shopping_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  
  -- Scheduling
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  
  -- Stream Details
  stream_url TEXT,
  stream_key TEXT,
  chat_room_id TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'live', 'ended', 'cancelled'
  )),
  
  -- Products Featured
  featured_products UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Engagement
  viewers_peak INTEGER DEFAULT 0,
  viewers_total INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0.00,
  
  -- Special Offers
  event_discount_percent INTEGER DEFAULT 0,
  exclusive_products UUID[] DEFAULT ARRAY[]::UUID[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_event_creator FOREIGN KEY (creator_id) REFERENCES creator_storefronts(id) ON DELETE CASCADE
);

CREATE INDEX idx_live_events_creator ON live_shopping_events(creator_id);
CREATE INDEX idx_live_events_status ON live_shopping_events(status);
CREATE INDEX idx_live_events_scheduled ON live_shopping_events(scheduled_start DESC);
CREATE INDEX idx_live_events_live ON live_shopping_events(status) WHERE status = 'live';

-- Event Attendees (Who's watching)
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  watch_duration INTEGER DEFAULT 0,
  
  -- Engagement
  messages_sent INTEGER DEFAULT 0,
  products_clicked INTEGER DEFAULT 0,
  purchases_made INTEGER DEFAULT 0,
  amount_spent DECIMAL(10,2) DEFAULT 0.00,
  
  -- Special Roles
  is_vip BOOLEAN DEFAULT false,
  badges TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  CONSTRAINT fk_attendee_event FOREIGN KEY (event_id) REFERENCES live_shopping_events(id) ON DELETE CASCADE,
  -- Removed: CONSTRAINT fk_attendee_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_attendee UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user ON event_attendees(user_id);

-- Event Chat Messages (Live chat during events)
CREATE TABLE IF NOT EXISTS event_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN (
    'text', 'emoji', 'sticker', 'product_share', 'purchase_celebration'
  )),
  
  -- Moderation
  is_pinned BOOLEAN DEFAULT false,
  is_highlighted BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  deleted_reason TEXT,
  
  -- Engagement
  reactions JSONB DEFAULT '{}'::jsonb,
  reply_to_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_chat_event FOREIGN KEY (event_id) REFERENCES live_shopping_events(id) ON DELETE CASCADE
  -- Removed: CONSTRAINT fk_chat_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_event_chat_event ON event_chat_messages(event_id);
CREATE INDEX idx_event_chat_created ON event_chat_messages(created_at DESC);

-- Event Product Moments (Highlight reels)
CREATE TABLE IF NOT EXISTS event_product_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  product_id UUID NOT NULL,
  
  timestamp_seconds INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  -- Engagement
  clicks INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_moment_event FOREIGN KEY (event_id) REFERENCES live_shopping_events(id) ON DELETE CASCADE,
  CONSTRAINT fk_moment_product FOREIGN KEY (product_id) REFERENCES creator_products(id) ON DELETE CASCADE
);

CREATE INDEX idx_event_moments_event ON event_product_moments(event_id);
CREATE INDEX idx_event_moments_product ON event_product_moments(product_id);

-- =====================================================
-- SUBSCRIPTION BOXES & RECURRING REVENUE
-- Curated monthly boxes from creators
-- =====================================================

-- Subscription Plans (What creators offer)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  tagline TEXT,
  image_url TEXT,
  
  -- Pricing
  price_monthly DECIMAL(10,2) NOT NULL,
  price_quarterly DECIMAL(10,2),
  price_annual DECIMAL(10,2),
  
  -- Benefits
  products_per_box INTEGER NOT NULL,
  estimated_value DECIMAL(10,2),
  shipping_included BOOLEAN DEFAULT true,
  exclusive_products BOOLEAN DEFAULT false,
  early_access BOOLEAN DEFAULT false,
  
  -- Customization
  allow_preferences BOOLEAN DEFAULT true,
  preference_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  skip_allowed BOOLEAN DEFAULT true,
  cancel_anytime BOOLEAN DEFAULT true,
  
  -- Status
  active BOOLEAN DEFAULT true,
  spots_available INTEGER,
  waitlist_enabled BOOLEAN DEFAULT false,
  
  -- Stats
  subscribers_count INTEGER DEFAULT 0,
  retention_rate DECIMAL(3,2) DEFAULT 0.00,
  avg_lifetime_months DECIMAL(4,1) DEFAULT 0.0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_plan_creator FOREIGN KEY (creator_id) REFERENCES creator_storefronts(id) ON DELETE CASCADE
);

CREATE INDEX idx_subscription_plans_creator ON subscription_plans(creator_id);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(active) WHERE active = true;

-- User Subscriptions (Active memberships)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  
  -- Billing
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
  price_paid DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'paused', 'cancelled', 'expired', 'payment_failed'
  )),
  
  -- Dates
  start_date DATE NOT NULL,
  next_billing_date DATE,
  cancel_date DATE,
  cancel_reason TEXT,
  
  -- Preferences
  user_preferences JSONB DEFAULT '{}'::jsonb,
  shipping_address JSONB NOT NULL,
  
  -- Stats
  boxes_received INTEGER DEFAULT 0,
  boxes_skipped INTEGER DEFAULT 0,
  lifetime_value DECIMAL(10,2) DEFAULT 0.00,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_sub_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
  -- Removed: CONSTRAINT fk_sub_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_subscriptions_plan ON user_subscriptions(plan_id);
CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_billing ON user_subscriptions(next_billing_date);

-- Subscription Boxes (Individual shipments)
CREATE TABLE IF NOT EXISTS subscription_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  
  -- Box Details
  box_number INTEGER NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  theme TEXT,
  theme_description TEXT,
  
  -- Contents
  products JSONB NOT NULL,
  total_value DECIMAL(10,2) NOT NULL,
  
  -- Delivery
  status TEXT DEFAULT 'preparing' CHECK (status IN (
    'preparing', 'shipped', 'in_transit', 'delivered', 'returned', 'skipped'
  )),
  tracking_number TEXT,
  carrier TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Feedback
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_box_subscription FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  CONSTRAINT fk_box_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
);

CREATE INDEX idx_subscription_boxes_subscription ON subscription_boxes(subscription_id);
CREATE INDEX idx_subscription_boxes_plan ON subscription_boxes(plan_id);
CREATE INDEX idx_subscription_boxes_status ON subscription_boxes(status);
CREATE INDEX idx_subscription_boxes_month ON subscription_boxes(year, month);

-- Drop NOT NULL constraints on columns from previous migrations
DO $$ 
BEGIN
  ALTER TABLE subscription_boxes ALTER COLUMN subscription_id DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE subscription_boxes ALTER COLUMN plan_id DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE subscription_boxes ALTER COLUMN box_number DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE subscription_boxes ALTER COLUMN month DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE subscription_boxes ALTER COLUMN year DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE subscription_boxes ALTER COLUMN products DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

-- Add columns if they don't exist (for existing tables)
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS tier_id UUID REFERENCES subscription_tiers(id) ON DELETE CASCADE;
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS box_type TEXT CHECK (box_type IN ('ritual_kit', 'district_discovery', 'ai_curated', 'seasonal', 'limited_edition'));
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS theme TEXT;
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS story TEXT;
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS release_date DATE;
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS available_until DATE;
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS connected_hall_id UUID REFERENCES halls(id) ON DELETE SET NULL;
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS connected_street_id UUID REFERENCES streets(id) ON DELETE SET NULL;
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS connected_chapel_id UUID REFERENCES chapels(id) ON DELETE SET NULL;
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS season TEXT CHECK (season IN ('spring', 'summer', 'fall', 'winter', 'year_round'));
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS ritual_guide TEXT;
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS meditation_prompt TEXT;
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS music_playlist_url TEXT;
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS ai_curation_notes TEXT;
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS visual_theme JSONB DEFAULT '{}'::jsonb;
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS total_value DECIMAL(10,2);
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS limited_quantity INTEGER;
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS remaining_quantity INTEGER;
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE subscription_boxes ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add unique constraint separately
DO $$ 
BEGIN
  ALTER TABLE subscription_boxes ADD CONSTRAINT subscription_boxes_slug_unique UNIQUE (slug);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscription_boxes_tier ON subscription_boxes(tier_id);
CREATE INDEX IF NOT EXISTS idx_subscription_boxes_slug ON subscription_boxes(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_boxes_type ON subscription_boxes(box_type);
CREATE INDEX IF NOT EXISTS idx_subscription_boxes_release ON subscription_boxes(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_boxes_season ON subscription_boxes(season);
CREATE INDEX IF NOT EXISTS idx_subscription_boxes_hall ON subscription_boxes(connected_hall_id);
CREATE INDEX IF NOT EXISTS idx_subscription_boxes_street ON subscription_boxes(connected_street_id);

-- Calculate subscription satisfaction trends
CREATE OR REPLACE FUNCTION get_subscription_health_metrics(p_tier_id UUID)
RETURNS TABLE (
  avg_satisfaction DECIMAL(3,2),
  retention_rate DECIMAL(5,2),
  avg_boxes_before_cancel DECIMAL(5,2),
  top_loved_items TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    AVG(us.satisfaction_score)::DECIMAL(3,2),
    (COUNT(*) FILTER (WHERE us.status = 'active')::DECIMAL /
     COUNT(*)::DECIMAL * 100)::DECIMAL(5,2),
    AVG(us.total_boxes_received)::DECIMAL(5,2),
    ARRAY_AGG(DISTINCT sd.repurchase_items[1]) FILTER (WHERE sd.repurchase_items IS NOT NULL)
  FROM user_subscriptions us
  LEFT JOIN subscription_deliveries sd ON sd.subscription_id = us.id
  WHERE us.tier_id = p_tier_id
  GROUP BY us.tier_id;
END;
$$ LANGUAGE plpgsql;

-- Auto-update AI confidence as it learns users
CREATE OR REPLACE FUNCTION update_curation_confidence()
RETURNS void AS $$
DECLARE
  profile_record RECORD;
  new_confidence DECIMAL(3,2);
BEGIN
  FOR profile_record IN
    SELECT acp.id, acp.user_id, acp.subscription_id
    FROM ai_curation_profiles acp
    INNER JOIN user_subscriptions us ON us.id = acp.subscription_id
    WHERE us.status = 'active'
  LOOP
    -- Calculate confidence based on deliveries and ratings
    SELECT
      LEAST(
        1.0,
        (COUNT(*) * 0.1 + AVG(COALESCE(user_rating, 3)) / 5.0) / 2
      )::DECIMAL(3,2)
    INTO new_confidence
    FROM subscription_deliveries
    WHERE subscription_id = profile_record.subscription_id
      AND delivered_at IS NOT NULL;

    UPDATE ai_curation_profiles
    SET
      confidence_score = COALESCE(new_confidence, 0.5),
      last_learning_update = NOW()
    WHERE id = profile_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Seed Sample Subscription Box (January 2026)
INSERT INTO subscription_boxes (tier_id, name, slug, box_type, theme, description, story, release_date, season, ritual_guide, connected_chapel_id, visual_theme, total_value) VALUES
((SELECT id FROM subscription_tiers WHERE slug = 'mystic-ritual'), 
 'Winter Solstice Sanctuary', 
 'winter-solstice-2026', 
 'ritual_kit', 
 'Deep Winter Introspection',
 'A curated collection for your winter solstice rituals: crystalline tools, warming incense, and objects of contemplation.',
 'As the longest night unfolds, we gather tools for inner illumination. Each item in this box has been chosen to support your journey inward, honoring the wisdom that dwells in darkness before the return of light.',
 '2026-01-01',
 'winter',
 'Begin by cleansing your space with sage. Light the candle as you set intentions. Hold the crystal during meditation. Use the journal for reflection.',
 (SELECT id FROM chapels WHERE slug = 'quiet-thoughts'),
 '{"primary_color": "#0C4A6E", "accent_color": "#F8FAFC", "pattern": "snowflake", "material": "frosted"}'::jsonb,
 145.00),
((SELECT id FROM subscription_tiers WHERE slug = 'neon-district'),
 'Innovation Pulse: Tech Futures',
 'innovation-pulse-jan-2026',
 'district_discovery',
 'Bleeding Edge Tech & Design',
 'The hottest drops from Neon Boulevard''s most innovative makers: smart objects, digital art, future-forward design.',
 'This month we''re spotlighting three emerging tech artisans who are reimagining everyday objects with AI, light, and interaction. Each piece is a conversation between human creativity and machine intelligence.',
 '2026-01-15',
 'year_round',
 'Unbox in order: Start with the digital NFT card, then discover each physical object. Use the AR app to unlock hidden features.',
 NULL,
 '{"primary_color": "#8B5CF6", "accent_color": "#EC4899", "pattern": "circuit", "material": "holographic"}'::jsonb,
 240.00)
ON CONFLICT (slug) DO NOTHING;

-- Seed Sample Box Items
INSERT INTO subscription_box_items (box_id, item_name, item_description, item_type, quantity, retail_value, origin_district, artisan_story, ritual_use, symbolic_meaning, position_in_box) VALUES
((SELECT id FROM subscription_boxes WHERE slug = 'winter-solstice-2026'),
 'Moonstone Meditation Crystal',
 'Hand-polished rainbow moonstone for intuitive connection',
 'ritual_object', 1, 32.00, 'makers-sanctuary',
 'Sourced from a family-run crystal collective in the Makers Sanctuary, each stone is chosen for its luminous quality.',
 'Hold during meditation to enhance intuition and inner knowing',
 'Moonstone represents the divine feminine, intuition, and cycles of transformation',
 1),
((SELECT id FROM subscription_boxes WHERE slug = 'winter-solstice-2026'),
 'Winter Pine & Sage Incense',
 'Hand-rolled incense with wildcrafted pine and white sage',
 'ritual_object', 1, 24.00, 'wellness-way',
 'Our herbalist blends wildcrafted herbs with traditional wisdom passed down through generations.',
 'Light to cleanse and consecrate your ritual space',
 'Pine represents resilience and ancient wisdom, sage brings clarity and purification',
 2),
((SELECT id FROM subscription_boxes WHERE slug = 'winter-solstice-2026'),
 'Solstice Ritual Candle',
 'Soy wax candle with essential oils for contemplation',
 'ritual_object', 1, 28.00, 'makers-sanctuary',
 'Hand-poured in small batches using locally sourced soy wax and therapeutic-grade essential oils.',
 'Light as the centerpiece of your altar, let it burn during contemplation',
 'Fire represents transformation, illumination emerging from darkness',
 3),
((SELECT id FROM subscription_boxes WHERE slug = 'winter-solstice-2026'),
 'Introspection Journal',
 'Handbound journal with moon phase tracker',
 'ritual_object', 1, 35.00, 'makers-sanctuary',
 'Each journal is sewn by hand using recycled cotton paper and plant-dyed covers.',
 'Record dreams, insights, and intentions throughout the lunar cycle',
 'The blank page holds infinite potential for self-discovery',
 4),
((SELECT id FROM subscription_boxes WHERE slug = 'winter-solstice-2026'),
 'Mystery Winter Elixir',
 'Surprise herbal tea blend for deep rest',
 'surprise', 1, 26.00, 'wellness-way',
 'Our herbalist creates a unique blend each month based on seasonal needs.',
 'Brew before bedtime rituals to support deep rest and dream work',
 'Each sip is an invitation to slow down and receive',
 5)
ON CONFLICT DO NOTHING;

-- AI Curation Profiles (Learns user preferences)
CREATE TABLE IF NOT EXISTS ai_curation_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  taste_profile JSONB NOT NULL DEFAULT '{}'::jsonb, -- {loves: [], dislikes: [], curious_about: []}
  preferred_halls TEXT[] DEFAULT '{}',
  preferred_streets TEXT[] DEFAULT '{}',
  preferred_emotions TEXT[] DEFAULT '{}', -- From chapels
  intensity_preference TEXT DEFAULT 'balanced' CHECK (intensity_preference IN ('minimal', 'balanced', 'maximal')),
  novelty_vs_familiar DECIMAL(2,1) DEFAULT 5.0, -- 0-10 scale
  price_sensitivity TEXT DEFAULT 'medium' CHECK (price_sensitivity IN ('low', 'medium', 'high')),
  ritual_engagement_level TEXT DEFAULT 'moderate' CHECK (ritual_engagement_level IN ('casual', 'moderate', 'devoted')),
  color_preferences TEXT[] DEFAULT '{}',
  material_preferences TEXT[] DEFAULT '{}', -- 'natural', 'tech', 'handmade'
  avoid_list TEXT[] DEFAULT '{}',
  learning_data JSONB DEFAULT '{}'::jsonb, -- AI's notes on user patterns
  confidence_score DECIMAL(3,2) DEFAULT 0.5, -- How well AI knows this user (0-1)
  last_learning_update TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_curation_profiles_user ON ai_curation_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_curation_profiles_subscription ON ai_curation_profiles(subscription_id);
CREATE INDEX IF NOT EXISTS idx_ai_curation_profiles_confidence ON ai_curation_profiles(confidence_score DESC);

-- AI Curation Algorithm
CREATE OR REPLACE FUNCTION generate_personalized_box(
  p_user_id TEXT,
  p_box_id UUID
)
RETURNS TABLE (
  item_id UUID,
  item_name TEXT,
  match_score DECIMAL(3,2),
  reason TEXT
) AS $$
DECLARE
  profile RECORD;
  box RECORD;
BEGIN
  -- Get user's curation profile
  SELECT * INTO profile
  FROM ai_curation_profiles
  WHERE user_id = p_user_id;

  -- Get box details
  SELECT * INTO box
  FROM subscription_boxes
  WHERE id = p_box_id;

  -- Return curated items based on profile + box theme
  RETURN QUERY
  SELECT
    sbi.id,
    sbi.item_name,
    (
      CASE
        WHEN sbi.origin_district = ANY(profile.preferred_halls) THEN 0.3
        ELSE 0.0
      END +
      CASE
        WHEN profile.novelty_vs_familiar > 7 AND sbi.surprise_factor THEN 0.3
        ELSE 0.1
      END +
      0.4 -- Base match for being in this themed box
    )::DECIMAL(3,2) AS match_score,
    COALESCE(sbi.ai_selection_reason, 'Selected for ' || box.theme) AS reason
  FROM subscription_box_items sbi
  WHERE sbi.box_id = p_box_id
    AND sbi.item_name != ALL(COALESCE(profile.avoid_list, ARRAY[]::TEXT[]))
  ORDER BY match_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Subscription Box Items (Contents of each box)
CREATE TABLE IF NOT EXISTS subscription_box_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id UUID REFERENCES subscription_boxes(id) ON DELETE CASCADE,
  product_id UUID, -- Could reference products or microstores
  item_name TEXT NOT NULL,
  item_description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('product', 'ritual_object', 'experience', 'digital_content', 'surprise')),
  quantity INTEGER DEFAULT 1,
  retail_value DECIMAL(10,2),
  origin_district TEXT, -- Which microstore/district it comes from
  artisan_story TEXT, -- Backstory of maker/creator
  ritual_use TEXT, -- How to use in the month's ritual
  symbolic_meaning TEXT, -- Deeper significance
  ai_selection_reason TEXT, -- Why AI chose this item
  position_in_box INTEGER, -- Unboxing sequence matters
  surprise_factor BOOLEAN DEFAULT FALSE, -- Some items are mystery items
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_box_items_box ON subscription_box_items(box_id);
CREATE INDEX IF NOT EXISTS idx_subscription_box_items_product ON subscription_box_items(product_id);
CREATE INDEX IF NOT EXISTS idx_subscription_box_items_type ON subscription_box_items(item_type);

-- Subscription Deliveries (Tracking)
CREATE TABLE IF NOT EXISTS subscription_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  box_id UUID REFERENCES subscription_boxes(id) ON DELETE SET NULL,
  delivery_status TEXT NOT NULL DEFAULT 'preparing' CHECK (delivery_status IN ('preparing', 'curating', 'packed', 'shipped', 'delivered', 'issue')),
  personalization_applied JSONB DEFAULT '{}'::jsonb, -- How AI customized this delivery
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  expected_delivery DATE,
  unboxing_experience JSONB DEFAULT '{}'::jsonb, -- User's reaction, photos, ratings
  user_rating DECIMAL(2,1), -- 1-5 stars
  user_feedback TEXT,
  repurchase_items TEXT[], -- Items user wants to buy more of
  skip_reason TEXT, -- If user skipped this month
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_deliveries_subscription ON subscription_deliveries(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_deliveries_box ON subscription_deliveries(box_id);
CREATE INDEX IF NOT EXISTS idx_subscription_deliveries_status ON subscription_deliveries(delivery_status);
CREATE INDEX IF NOT EXISTS idx_subscription_deliveries_delivered ON subscription_deliveries(delivered_at DESC);

-- Subscription Waitlist (For limited spots)
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
  -- Removed: CONSTRAINT fk_waitlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_waitlist UNIQUE(plan_id, user_id)
);

CREATE INDEX idx_subscription_waitlist_plan ON subscription_waitlist(plan_id);
CREATE INDEX idx_subscription_waitlist_position ON subscription_waitlist(plan_id, position);

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
GRANT ALL ON subscription_box_items TO postgres, anon, authenticated;
GRANT ALL ON subscription_deliveries TO postgres, anon, authenticated;
GRANT ALL ON ai_curation_profiles TO postgres, anon, authenticated;
GRANT ALL ON subscription_waitlist TO postgres, anon, authenticated;
