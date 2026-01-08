-- ============================================================================
-- AI CITY CONSCIOUSNESS LAYER MIGRATION - PART 1
-- Tables and Indexes Only
-- ============================================================================

-- ============================================================================
-- 1. EMOTIONAL INTELLIGENCE TABLES
-- ============================================================================

-- Track user emotional states detected from behavioral signals
CREATE TABLE IF NOT EXISTS user_emotional_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT,
  
  -- Emotional detection
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  primary_emotion TEXT NOT NULL,
  intensity INTEGER NOT NULL CHECK (intensity >= 0 AND intensity <= 100),
  secondary_emotion TEXT,
  
  -- Detected needs
  needs TEXT[] DEFAULT '{}',
  emotional_triggers TEXT[],
  
  -- Recommendations
  recommended_journey TEXT,
  chapel_affinity TEXT,
  color_palette TEXT[] DEFAULT '{}',
  music_tempo TEXT,
  
  -- Transformation tracking
  transformation_achieved TEXT,
  transformation_duration INTERVAL,
  
  -- Behavioral context
  behavioral_signals JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emotional_states_user ON user_emotional_states(user_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_emotional_states_emotion ON user_emotional_states(primary_emotion, intensity);
CREATE INDEX IF NOT EXISTS idx_emotional_states_session ON user_emotional_states(session_id);
CREATE INDEX IF NOT EXISTS idx_emotional_states_transformation ON user_emotional_states(transformation_achieved) WHERE transformation_achieved IS NOT NULL;

-- ============================================================================
-- 2. AI CURATOR RELATIONSHIP TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS curator_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  curator_name TEXT NOT NULL,
  
  relationship_stage TEXT DEFAULT 'stranger',
  interactions_count INTEGER DEFAULT 0,
  first_met TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  topics_discussed TEXT[] DEFAULT '{}',
  products_recommended UUID[] DEFAULT '{}',
  user_preferences_learned TEXT[] DEFAULT '{}',
  emotional_patterns_observed JSONB DEFAULT '{}',
  
  shared_moments JSONB DEFAULT '[]',
  
  curator_notes TEXT,
  growth_observed TEXT[],
  
  messages_sent INTEGER DEFAULT 0,
  recommendations_accepted INTEGER DEFAULT 0,
  rituals_created INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, curator_name)
);

CREATE INDEX IF NOT EXISTS idx_curator_memories_user ON curator_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_curator_memories_curator ON curator_memories(curator_name);
CREATE INDEX IF NOT EXISTS idx_curator_memories_stage ON curator_memories(relationship_stage);
CREATE INDEX IF NOT EXISTS idx_curator_memories_last_interaction ON curator_memories(last_interaction DESC);

-- ============================================================================
-- 3. PERSONAL RITUALS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS personal_rituals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  curator_name TEXT NOT NULL,
  
  ritual_name TEXT NOT NULL,
  intention TEXT NOT NULL,
  steps TEXT[] NOT NULL,
  duration TEXT,
  best_time TEXT,
  
  products_used UUID[] DEFAULT '{}',
  product_notes JSONB DEFAULT '{}',
  
  times_practiced INTEGER DEFAULT 0,
  last_practiced TIMESTAMP WITH TIME ZONE,
  effectiveness_rating INTEGER,
  user_notes TEXT,
  
  created_for_emotion TEXT,
  target_emotion TEXT,
  
  is_active BOOLEAN DEFAULT true,
  is_favorite BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rituals_user ON personal_rituals(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_rituals_curator ON personal_rituals(curator_name);
CREATE INDEX IF NOT EXISTS idx_rituals_practiced ON personal_rituals(last_practiced DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rituals_favorite ON personal_rituals(user_id) WHERE is_favorite = true;

-- ============================================================================
-- 4. PRODUCT EMOTIONAL SCORES
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_emotional_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  emotion TEXT NOT NULL,
  
  resonance_score INTEGER NOT NULL CHECK (resonance_score >= 0 AND resonance_score <= 100),
  why_it_matters TEXT NOT NULL,
  ritual_suggestion TEXT,
  complementary_emotion TEXT,
  
  score_confidence INTEGER DEFAULT 80,
  validated_by_usage BOOLEAN DEFAULT false,
  validation_count INTEGER DEFAULT 0,
  
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
  
  UNIQUE(product_id, emotion)
);

CREATE INDEX IF NOT EXISTS idx_emotional_scores_product ON product_emotional_scores(product_id);
CREATE INDEX IF NOT EXISTS idx_emotional_scores_emotion ON product_emotional_scores(emotion, resonance_score DESC);
CREATE INDEX IF NOT EXISTS idx_emotional_scores_expires ON product_emotional_scores(expires_at);
CREATE INDEX IF NOT EXISTS idx_emotional_scores_validated ON product_emotional_scores(validated_by_usage) WHERE validated_by_usage = true;

-- ============================================================================
-- 5. TRANSFORMATION JOURNEYS
-- ============================================================================

CREATE TABLE IF NOT EXISTS transformation_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  
  journey_type TEXT NOT NULL,
  starting_emotion TEXT NOT NULL,
  target_emotion TEXT NOT NULL,
  
  planned_path JSONB NOT NULL,
  completed_steps TEXT[] DEFAULT '{}',
  current_step INTEGER DEFAULT 0,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_step_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  transformation_achieved BOOLEAN,
  final_emotion TEXT,
  user_reflection TEXT,
  curator_reflection TEXT,
  
  products_purchased_during UUID[] DEFAULT '{}',
  chapels_visited UUID[] DEFAULT '{}',
  rituals_practiced INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  abandoned_at TIMESTAMP WITH TIME ZONE,
  abandonment_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journeys_user ON transformation_journeys(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_journeys_type ON transformation_journeys(journey_type);
CREATE INDEX IF NOT EXISTS idx_journeys_completed ON transformation_journeys(completed_at) WHERE transformation_achieved = true;
CREATE INDEX IF NOT EXISTS idx_journeys_active ON transformation_journeys(is_active, current_step) WHERE is_active = true;

-- ============================================================================
-- 6. CONSCIOUSNESS ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS consciousness_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  
  emotion_distribution JSONB,
  average_intensity DECIMAL(5,2),
  
  curator_interactions JSONB,
  new_relationships INTEGER DEFAULT 0,
  relationship_evolutions INTEGER DEFAULT 0,
  
  rituals_created INTEGER DEFAULT 0,
  rituals_practiced INTEGER DEFAULT 0,
  ritual_effectiveness_avg DECIMAL(3,2),
  
  journeys_started INTEGER DEFAULT 0,
  journeys_completed INTEGER DEFAULT 0,
  transformation_rate DECIMAL(5,2),
  
  healing_moments INTEGER DEFAULT 0,
  crisis_interventions INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(date)
);

CREATE INDEX IF NOT EXISTS idx_consciousness_analytics_date ON consciousness_analytics(date DESC);

-- ============================================================================
-- 7. HEALING MOMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS healing_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  curator_name TEXT,
  
  before_emotion TEXT NOT NULL,
  before_intensity INTEGER,
  after_emotion TEXT NOT NULL,
  after_intensity INTEGER,
  
  moment_type TEXT,
  trigger_event TEXT,
  trigger_id UUID,
  
  user_description TEXT,
  curator_observation TEXT,
  significance_score INTEGER DEFAULT 50,
  
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_healing_moments_user ON healing_moments(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_healing_moments_curator ON healing_moments(curator_name);
CREATE INDEX IF NOT EXISTS idx_healing_moments_type ON healing_moments(moment_type);
CREATE INDEX IF NOT EXISTS idx_healing_moments_significance ON healing_moments(significance_score DESC);

-- Success!
DO $$
BEGIN
  RAISE NOTICE '✅ Part 1 Complete: 7 tables created';
  RAISE NOTICE 'Next: Run supabase-consciousness-migration-part2.sql';
END $$;
