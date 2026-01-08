-- ============================================================================
-- AI CITY CONSCIOUSNESS LAYER MIGRATION
-- ============================================================================
-- This migration adds emotional intelligence and AI curator relationship
-- systems to transform AI City from transactional to relational commerce.
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
  primary_emotion TEXT NOT NULL, -- seeking, stressed, curious, purposeful, playful, melancholic, excited
  intensity INTEGER NOT NULL CHECK (intensity >= 0 AND intensity <= 100),
  secondary_emotion TEXT,
  
  -- Detected needs
  needs TEXT[] DEFAULT '{}',
  emotional_triggers TEXT[], -- What caused this state
  
  -- Recommendations
  recommended_journey TEXT, -- stress_to_calm, seeking_to_inspired, etc.
  chapel_affinity TEXT, -- Which chapel resonates
  color_palette TEXT[] DEFAULT '{}',
  music_tempo TEXT, -- slow, medium, upbeat
  
  -- Transformation tracking
  transformation_achieved TEXT, -- Did they reach target emotion?
  transformation_duration INTERVAL, -- How long did it take?
  
  -- Behavioral context that led to detection
  behavioral_signals JSONB, -- Store raw signals for learning
  
  -- Indexes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emotional_states_user ON user_emotional_states(user_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_emotional_states_emotion ON user_emotional_states(primary_emotion, intensity);
CREATE INDEX IF NOT EXISTS idx_emotional_states_session ON user_emotional_states(session_id);
CREATE INDEX IF NOT EXISTS idx_emotional_states_transformation ON user_emotional_states(transformation_achieved) WHERE transformation_achieved IS NOT NULL;

-- ============================================================================
-- 2. AI CURATOR RELATIONSHIP TABLES
-- ============================================================================

-- Track relationships between users and AI curators
CREATE TABLE IF NOT EXISTS curator_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  curator_name TEXT NOT NULL, -- aurora, sage, flux, echo, spark
  
  -- Relationship evolution
  relationship_stage TEXT DEFAULT 'stranger', -- stranger, acquaintance, friend, confidant
  interactions_count INTEGER DEFAULT 0,
  first_met TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Memory and learning
  topics_discussed TEXT[] DEFAULT '{}',
  products_recommended UUID[] DEFAULT '{}',
  user_preferences_learned TEXT[] DEFAULT '{}',
  emotional_patterns_observed JSONB DEFAULT '{}',
  
  -- Shared moments (milestones in relationship)
  shared_moments JSONB DEFAULT '[]', -- [{date, moment, significance}]
  
  -- Curator insights about user
  curator_notes TEXT, -- Private notes curator keeps about user's journey
  growth_observed TEXT[], -- Transformations curator has witnessed
  
  -- Engagement metrics
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

-- Store personalized rituals created for users
CREATE TABLE IF NOT EXISTS personal_rituals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  curator_name TEXT NOT NULL, -- Which curator created this ritual
  
  -- Ritual details
  ritual_name TEXT NOT NULL,
  intention TEXT NOT NULL, -- What this ritual is meant to achieve
  steps TEXT[] NOT NULL, -- Step-by-step instructions
  duration TEXT, -- "10 minutes", "30 minutes", etc.
  best_time TEXT, -- "morning", "evening", "whenever you feel stressed"
  
  -- Products involved
  products_used UUID[] DEFAULT '{}', -- Product IDs used in ritual
  product_notes JSONB DEFAULT '{}', -- How each product is used
  
  -- Usage tracking
  times_practiced INTEGER DEFAULT 0,
  last_practiced TIMESTAMP WITH TIME ZONE,
  effectiveness_rating INTEGER, -- 1-5, user feedback
  user_notes TEXT, -- User's personal modifications/reflections
  
  -- Emotional context
  created_for_emotion TEXT, -- What emotion triggered creation
  target_emotion TEXT, -- What emotion ritual aims to cultivate
  
  -- Status
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
-- 4. PRODUCT EMOTIONAL SCORES (CACHE TABLE)
-- ============================================================================

-- Cache emotional resonance scores for products
-- This prevents re-calculating AI scores for same product-emotion pairs
CREATE TABLE IF NOT EXISTS product_emotional_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  emotion TEXT NOT NULL, -- seeking, stressed, curious, etc.
  
  -- Score details
  resonance_score INTEGER NOT NULL CHECK (resonance_score >= 0 AND resonance_score <= 100),
  why_it_matters TEXT NOT NULL, -- AI-generated explanation
  ritual_suggestion TEXT, -- How to use this product ritually
  complementary_emotion TEXT, -- What emotion this might cultivate
  
  -- Validation
  score_confidence INTEGER DEFAULT 80, -- How confident AI is (0-100)
  validated_by_usage BOOLEAN DEFAULT false, -- Has a user confirmed this works?
  validation_count INTEGER DEFAULT 0, -- How many users validated
  
  -- Cache management
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
  
  UNIQUE(product_id, emotion)
);

CREATE INDEX IF NOT EXISTS idx_emotional_scores_product ON product_emotional_scores(product_id);
CREATE INDEX IF NOT EXISTS idx_emotional_scores_emotion ON product_emotional_scores(emotion, resonance_score DESC);
CREATE INDEX IF NOT EXISTS idx_emotional_scores_expires ON product_emotional_scores(expires_at);
CREATE INDEX IF NOT EXISTS idx_emotional_scores_validated ON product_emotional_scores(validated_by_usage) WHERE validated_by_usage = true;

-- ============================================================================
-- 5. TRANSFORMATION JOURNEYS (TRACKING)
-- ============================================================================

-- Track users' transformation journeys through AI City
CREATE TABLE IF NOT EXISTS transformation_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  
  -- Journey definition
  journey_type TEXT NOT NULL, -- stress_to_calm, seeking_to_inspired, etc.
  starting_emotion TEXT NOT NULL,
  target_emotion TEXT NOT NULL,
  
  -- Journey path
  planned_path JSONB NOT NULL, -- [{chapel, purpose, duration}]
  completed_steps TEXT[] DEFAULT '{}',
  current_step INTEGER DEFAULT 0,
  
  -- Progress tracking
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_step_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Outcome
  transformation_achieved BOOLEAN,
  final_emotion TEXT,
  user_reflection TEXT, -- User's thoughts on journey
  curator_reflection TEXT, -- Curator's notes on transformation
  
  -- Engagement
  products_purchased_during UUID[] DEFAULT '{}',
  chapels_visited UUID[] DEFAULT '{}',
  rituals_practiced INTEGER DEFAULT 0,
  
  -- Status
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
-- 6. CONSCIOUSNESS ANALYTICS (AGGREGATE METRICS)
-- ============================================================================

-- Daily aggregated consciousness metrics
CREATE TABLE IF NOT EXISTS consciousness_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  
  -- Emotional distribution
  emotion_distribution JSONB, -- {seeking: 125, stressed: 89, curious: 201, ...}
  average_intensity DECIMAL(5,2),
  
  -- Curator metrics
  curator_interactions JSONB, -- {aurora: 450, sage: 389, flux: 567, ...}
  new_relationships INTEGER DEFAULT 0,
  relationship_evolutions INTEGER DEFAULT 0, -- How many moved to next stage
  
  -- Ritual metrics
  rituals_created INTEGER DEFAULT 0,
  rituals_practiced INTEGER DEFAULT 0,
  ritual_effectiveness_avg DECIMAL(3,2), -- Average rating
  
  -- Transformation metrics
  journeys_started INTEGER DEFAULT 0,
  journeys_completed INTEGER DEFAULT 0,
  transformation_rate DECIMAL(5,2), -- % of journeys that succeeded
  
  -- Healing moments
  healing_moments INTEGER DEFAULT 0, -- Significant positive shifts
  crisis_interventions INTEGER DEFAULT 0, -- Curator helped in distress
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(date)
);

CREATE INDEX IF NOT EXISTS idx_consciousness_analytics_date ON consciousness_analytics(date DESC);

-- ============================================================================
-- 7. HEALING MOMENTS (SIGNIFICANT EMOTIONAL SHIFTS)
-- ============================================================================

-- Record significant positive emotional shifts (the magic moments)
CREATE TABLE IF NOT EXISTS healing_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  curator_name TEXT,
  
  -- What happened
  before_emotion TEXT NOT NULL,
  before_intensity INTEGER,
  after_emotion TEXT NOT NULL,
  after_intensity INTEGER,
  
  -- Context
  moment_type TEXT, -- breakthrough, relief, joy_discovery, peace_found, etc.
  trigger_event TEXT, -- product_purchase, ritual_completion, curator_message, chapel_visit
  trigger_id UUID, -- ID of the product/ritual/etc that triggered this
  
  -- Details
  user_description TEXT, -- How user described what happened
  curator_observation TEXT, -- What curator noticed
  significance_score INTEGER DEFAULT 50, -- How meaningful (0-100)
  
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_healing_moments_user ON healing_moments(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_healing_moments_curator ON healing_moments(curator_name);
CREATE INDEX IF NOT EXISTS idx_healing_moments_type ON healing_moments(moment_type);
CREATE INDEX IF NOT EXISTS idx_healing_moments_significance ON healing_moments(significance_score DESC);

-- ============================================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all consciousness tables
ALTER TABLE user_emotional_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE curator_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_rituals ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_emotional_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transformation_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE consciousness_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE healing_moments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own emotional states" ON user_emotional_states;
DROP POLICY IF EXISTS "System can insert emotional states" ON user_emotional_states;
DROP POLICY IF EXISTS "Users can view own curator memories" ON curator_memories;
DROP POLICY IF EXISTS "System can manage curator memories" ON curator_memories;
DROP POLICY IF EXISTS "Users can view own rituals" ON personal_rituals;
DROP POLICY IF EXISTS "System can create rituals" ON personal_rituals;
DROP POLICY IF EXISTS "Users can update own rituals" ON personal_rituals;
DROP POLICY IF EXISTS "Anyone can view emotional scores" ON product_emotional_scores;
DROP POLICY IF EXISTS "System can manage emotional scores" ON product_emotional_scores;
DROP POLICY IF EXISTS "Users can view own journeys" ON transformation_journeys;
DROP POLICY IF EXISTS "System can manage journeys" ON transformation_journeys;
DROP POLICY IF EXISTS "Anyone can view consciousness analytics" ON consciousness_analytics;
DROP POLICY IF EXISTS "System can manage analytics" ON consciousness_analytics;
DROP POLICY IF EXISTS "Users can view own healing moments" ON healing_moments;
DROP POLICY IF EXISTS "System can record healing moments" ON healing_moments;

-- Users can only see their own emotional states
CREATE POLICY "Users can view own emotional states" ON user_emotional_states
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can insert emotional states" ON user_emotional_states
  FOR INSERT WITH CHECK (true);

-- Users can only see their own curator memories
CREATE POLICY "Users can view own curator memories" ON curator_memories
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can manage curator memories" ON curator_memories
  FOR ALL USING (true);

-- Users can view and manage their own rituals
CREATE POLICY "Users can view own rituals" ON personal_rituals
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can create rituals" ON personal_rituals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own rituals" ON personal_rituals
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Emotional scores are public (cached AI computations)
CREATE POLICY "Anyone can view emotional scores" ON product_emotional_scores
  FOR SELECT USING (true);

CREATE POLICY "System can manage emotional scores" ON product_emotional_scores
  FOR ALL USING (true);

-- Users can view their own journeys
CREATE POLICY "Users can view own journeys" ON transformation_journeys
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can manage journeys" ON transformation_journeys
  FOR ALL USING (true);

-- Analytics are public
CREATE POLICY "Anyone can view consciousness analytics" ON consciousness_analytics
  FOR SELECT USING (true);

CREATE POLICY "System can manage analytics" ON consciousness_analytics
  FOR ALL USING (true);

-- Users can view their own healing moments
CREATE POLICY "Users can view own healing moments" ON healing_moments
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can record healing moments" ON healing_moments
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 9. HELPER FUNCTIONS
-- ============================================================================

-- Function to update curator memory last_interaction timestamp
CREATE OR REPLACE FUNCTION update_curator_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_interaction = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS curator_memory_update_timestamp ON curator_memories;
CREATE TRIGGER curator_memory_update_timestamp
  BEFORE UPDATE ON curator_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_curator_last_interaction();

-- Function to increment ritual practice count
CREATE OR REPLACE FUNCTION record_ritual_practice(ritual_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE personal_rituals
  SET 
    times_practiced = times_practiced + 1,
    last_practiced = NOW(),
    updated_at = NOW()
  WHERE id = ritual_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to evolve curator relationship stage
CREATE OR REPLACE FUNCTION evolve_curator_relationship(
  p_user_id TEXT,
  p_curator_name TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_interactions INTEGER;
  v_days_known INTEGER;
  v_current_stage TEXT;
  v_new_stage TEXT;
BEGIN
  -- Get current stats
  SELECT 
    interactions_count,
    EXTRACT(DAY FROM (NOW() - first_met)),
    relationship_stage
  INTO v_interactions, v_days_known, v_current_stage
  FROM curator_memories
  WHERE user_id = p_user_id AND curator_name = p_curator_name;
  
  -- Determine new stage based on interactions and time
  IF v_interactions >= 15 AND v_days_known >= 30 THEN
    v_new_stage := 'confidant';
  ELSIF v_interactions >= 8 AND v_days_known >= 14 THEN
    v_new_stage := 'friend';
  ELSIF v_interactions >= 3 AND v_days_known >= 3 THEN
    v_new_stage := 'acquaintance';
  ELSE
    v_new_stage := 'stranger';
  END IF;
  
  -- Update if stage changed
  IF v_new_stage != v_current_stage THEN
    UPDATE curator_memories
    SET 
      relationship_stage = v_new_stage,
      updated_at = NOW()
    WHERE user_id = p_user_id AND curator_name = p_curator_name;
  END IF;
  
  RETURN v_new_stage;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired emotional scores cache
CREATE OR REPLACE FUNCTION cleanup_expired_emotional_scores()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM product_emotional_scores
  WHERE expires_at < NOW()
  RETURNING COUNT(*) INTO v_deleted;
  
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate daily consciousness metrics
CREATE OR REPLACE FUNCTION aggregate_consciousness_metrics(p_date DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO consciousness_analytics (
    date,
    emotion_distribution,
    average_intensity,
    curator_interactions,
    new_relationships,
    relationship_evolutions,
    rituals_created,
    rituals_practiced,
    ritual_effectiveness_avg,
    journeys_started,
    journeys_completed,
    transformation_rate,
    healing_moments,
    crisis_interventions
  )
  VALUES (
    p_date,
    
    -- Emotion distribution
    (SELECT jsonb_object_agg(primary_emotion, count)
     FROM (SELECT primary_emotion, COUNT(*) as count
           FROM user_emotional_states
           WHERE DATE(detected_at) = p_date
           GROUP BY primary_emotion) sq),
    
    -- Average intensity
    (SELECT AVG(intensity)
     FROM user_emotional_states
     WHERE DATE(detected_at) = p_date),
    
    -- Curator interactions
    (SELECT jsonb_object_agg(curator_name, interactions)
     FROM (SELECT curator_name, SUM(messages_sent) as interactions
           FROM curator_memories
           WHERE DATE(last_interaction) = p_date
           GROUP BY curator_name) sq),
    
    -- New relationships
    (SELECT COUNT(*)
     FROM curator_memories
     WHERE DATE(first_met) = p_date),
    
    -- Relationship evolutions
    (SELECT COUNT(*)
     FROM curator_memories
     WHERE DATE(updated_at) = p_date
     AND relationship_stage IN ('acquaintance', 'friend', 'confidant')),
    
    -- Rituals created
    (SELECT COUNT(*)
     FROM personal_rituals
     WHERE DATE(created_at) = p_date),
    
    -- Rituals practiced
    (SELECT COUNT(*)
     FROM personal_rituals
     WHERE DATE(last_practiced) = p_date),
    
    -- Ritual effectiveness average
    (SELECT AVG(effectiveness_rating)
     FROM personal_rituals
     WHERE effectiveness_rating IS NOT NULL
     AND DATE(last_practiced) = p_date),
    
    -- Journeys started
    (SELECT COUNT(*)
     FROM transformation_journeys
     WHERE DATE(started_at) = p_date),
    
    -- Journeys completed
    (SELECT COUNT(*)
     FROM transformation_journeys
     WHERE DATE(completed_at) = p_date
     AND transformation_achieved = true),
    
    -- Transformation rate
    (SELECT 
       CASE 
         WHEN COUNT(*) > 0 THEN 
           (COUNT(*) FILTER (WHERE transformation_achieved = true)::DECIMAL / COUNT(*)) * 100
         ELSE 0
       END
     FROM transformation_journeys
     WHERE DATE(completed_at) = p_date),
    
    -- Healing moments
    (SELECT COUNT(*)
     FROM healing_moments
     WHERE DATE(occurred_at) = p_date
     AND significance_score >= 70),
    
    -- Crisis interventions
    (SELECT COUNT(*)
     FROM healing_moments
     WHERE DATE(occurred_at) = p_date
     AND moment_type = 'crisis_intervention')
  )
  ON CONFLICT (date) DO UPDATE SET
    emotion_distribution = EXCLUDED.emotion_distribution,
    average_intensity = EXCLUDED.average_intensity,
    curator_interactions = EXCLUDED.curator_interactions,
    new_relationships = EXCLUDED.new_relationships,
    relationship_evolutions = EXCLUDED.relationship_evolutions,
    rituals_created = EXCLUDED.rituals_created,
    rituals_practiced = EXCLUDED.rituals_practiced,
    ritual_effectiveness_avg = EXCLUDED.ritual_effectiveness_avg,
    journeys_started = EXCLUDED.journeys_started,
    journeys_completed = EXCLUDED.journeys_completed,
    transformation_rate = EXCLUDED.transformation_rate,
    healing_moments = EXCLUDED.healing_moments,
    crisis_interventions = EXCLUDED.crisis_interventions;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. SAMPLE DATA (FOR TESTING)
-- ============================================================================

-- Insert sample emotional score cache for common products
-- (In production, these would be generated on-demand by AI)
COMMENT ON TABLE product_emotional_scores IS 'AI-generated emotional resonance scores cached for performance. Expires after 30 days to allow for re-evaluation.';

-- Insert sample curator memories for demonstration
-- (In production, these would be created when user first interacts)
COMMENT ON TABLE curator_memories IS 'Long-term memory system for AI curators. Tracks relationship evolution from stranger to confidant over time.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables were created
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'user_emotional_states',
    'curator_memories',
    'personal_rituals',
    'product_emotional_scores',
    'transformation_journeys',
    'consciousness_analytics',
    'healing_moments'
  );
  
  RAISE NOTICE '✅ Consciousness Layer Migration Complete';
  RAISE NOTICE '📊 Tables created: %', table_count;
  RAISE NOTICE '🌊 Emotional Intelligence: ACTIVE';
  RAISE NOTICE '👥 AI Curator System: ACTIVE';
  RAISE NOTICE '✨ Transformation Journeys: READY';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Test emotional detection: Call detectEmotionalState()';
  RAISE NOTICE '2. Match curators: Call matchCuratorToUser()';
  RAISE NOTICE '3. Create first ritual: Call createPersonalRitual()';
  RAISE NOTICE '4. Monitor analytics: Query consciousness_analytics table';
END $$;
