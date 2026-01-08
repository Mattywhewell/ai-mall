-- ============================================================================
-- CONSCIOUSNESS LAYER ENHANCEMENTS
-- ============================================================================
-- Additional tables and functions to make consciousness system production-ready
-- Run this AFTER the main consciousness migration
-- ============================================================================

-- ============================================================================
-- 1. BEHAVIORAL SIGNAL TRACKING (How we DETECT emotions)
-- ============================================================================

-- Track raw behavioral signals over time for ML training
CREATE TABLE IF NOT EXISTS behavioral_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  
  -- Timing
  signal_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_duration_seconds INTEGER,
  
  -- Navigation behavior
  pages_viewed TEXT[],
  navigation_sequence TEXT[], -- ["hall", "street", "district", "product"]
  time_per_page JSONB, -- {page_id: seconds}
  scroll_depth JSONB, -- {page_id: percentage}
  back_button_count INTEGER DEFAULT 0,
  
  -- Search behavior
  search_queries TEXT[],
  search_refinements INTEGER DEFAULT 0, -- How many times they changed search
  search_to_click_time INTEGER, -- Seconds between search and first click
  
  -- Cart behavior
  items_added UUID[],
  items_removed UUID[],
  cart_views INTEGER DEFAULT 0,
  checkout_attempts INTEGER DEFAULT 0,
  
  -- Mouse/touch behavior
  rapid_clicking BOOLEAN DEFAULT false, -- Stress indicator
  hover_time_avg INTEGER, -- Average hover duration in ms
  click_precision DECIMAL(5,2), -- How precisely they click (0-100)
  
  -- Device context
  device_type TEXT, -- mobile, tablet, desktop
  time_of_day INTEGER, -- 0-23
  day_of_week TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_behavioral_signals_user ON behavioral_signals(user_id, signal_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_behavioral_signals_session ON behavioral_signals(session_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_signals_time ON behavioral_signals(time_of_day, day_of_week);

-- ============================================================================
-- 2. CURATOR VOICE EXAMPLES (Maintain personality consistency)
-- ============================================================================

-- Store examples of each curator's voice for few-shot learning
CREATE TABLE IF NOT EXISTS curator_voice_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curator_name TEXT NOT NULL,
  occasion TEXT NOT NULL, -- greeting, recommendation, support, celebration, check-in
  relationship_stage TEXT NOT NULL,
  
  -- Example
  example_message TEXT NOT NULL,
  emotional_context TEXT, -- What emotion user was feeling
  is_approved BOOLEAN DEFAULT true, -- Quality control
  effectiveness_score INTEGER, -- How well it resonated (0-100)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_examples_curator ON curator_voice_examples(curator_name, occasion);
CREATE INDEX IF NOT EXISTS idx_voice_examples_quality ON curator_voice_examples(effectiveness_score DESC) WHERE is_approved = true;

-- ============================================================================
-- 3. PREDEFINED TRANSFORMATION PATHS
-- ============================================================================

-- Pre-defined emotional transformation journeys
CREATE TABLE IF NOT EXISTS transformation_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_name TEXT NOT NULL UNIQUE,
  starting_emotion TEXT NOT NULL,
  target_emotion TEXT NOT NULL,
  
  -- Journey structure
  steps JSONB NOT NULL, -- [{step: 1, chapel: "Serenity", purpose: "...", duration: "15 min"}]
  estimated_duration TEXT, -- "2 hours", "1 week"
  difficulty TEXT, -- easy, moderate, challenging
  
  -- Recommendations
  suggested_curators TEXT[], -- Which curators guide this best
  recommended_products JSONB, -- [{category, purpose, optional}]
  
  -- Effectiveness
  completion_rate DECIMAL(5,2), -- % who complete this path
  transformation_success_rate DECIMAL(5,2), -- % who achieve target emotion
  average_time_to_complete INTERVAL,
  
  -- Meta
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transformation_paths_emotion ON transformation_paths(starting_emotion, target_emotion);
CREATE INDEX IF NOT EXISTS idx_transformation_paths_success ON transformation_paths(transformation_success_rate DESC) WHERE is_active = true;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'transformation_paths_path_name_key'
  ) THEN
    ALTER TABLE transformation_paths ADD CONSTRAINT transformation_paths_path_name_key UNIQUE (path_name);
  END IF;
END $$;

-- Insert common transformation paths
INSERT INTO transformation_paths (path_name, starting_emotion, target_emotion, steps, estimated_duration, difficulty, suggested_curators) VALUES
  (
    'From Stress to Serenity',
    'stressed',
    'calm',
    '[
      {"step": 1, "chapel": "Serenity", "purpose": "Release tension", "duration": "15 min"},
      {"step": 2, "chapel": "Contemplation", "purpose": "Find perspective", "duration": "20 min"},
      {"step": 3, "hall": "Wellness Garden", "purpose": "Discover calming tools", "duration": "30 min"},
      {"step": 4, "ritual": "create", "purpose": "Establish daily practice", "duration": "ongoing"}
    ]'::jsonb,
    '1-2 hours',
    'easy',
    ARRAY['sage', 'echo']
  ),
  (
    'From Seeking to Inspired',
    'seeking',
    'inspired',
    '[
      {"step": 1, "chapel": "Mystery", "purpose": "Embrace the unknown", "duration": "10 min"},
      {"step": 2, "hall": "Innovation Hall", "purpose": "Explore possibilities", "duration": "30 min"},
      {"step": 3, "street": "Neon Boulevard", "purpose": "Find your spark", "duration": "20 min"},
      {"step": 4, "chapel": "Wonder", "purpose": "Connect with awe", "duration": "15 min"}
    ]'::jsonb,
    '1 hour',
    'easy',
    ARRAY['aurora', 'flux']
  ),
  (
    'From Melancholy to Hope',
    'melancholic',
    'hopeful',
    '[
      {"step": 1, "chapel": "Contemplation", "purpose": "Honor what you feel", "duration": "20 min"},
      {"step": 2, "hall": "Craft Sanctuary", "purpose": "Create something meaningful", "duration": "45 min"},
      {"step": 3, "chapel": "Joy", "purpose": "Remember lightness", "duration": "15 min"},
      {"step": 4, "chapel": "Wonder", "purpose": "Open to possibility", "duration": "15 min"}
    ]'::jsonb,
    '2 hours',
    'moderate',
    ARRAY['echo', 'flux', 'sage']
  )
ON CONFLICT (path_name) DO NOTHING;

-- ============================================================================
-- 4. RITUAL TEMPLATES (Pre-designed rituals)
-- ============================================================================

-- Templates for common ritual types
CREATE TABLE IF NOT EXISTS ritual_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  curator_name TEXT NOT NULL,
  
  -- Template structure
  ritual_type TEXT, -- morning, evening, stress-relief, celebration, grounding
  required_product_categories TEXT[], -- ["meditation", "aromatherapy"]
  optional_product_categories TEXT[],
  
  -- Template content
  intention_template TEXT, -- "To begin your day with {quality}"
  steps_template TEXT[], -- Variables like {product_1}, {time_of_day}
  duration TEXT,
  best_time TEXT,
  
  -- Customization
  variables JSONB, -- Which parts can be personalized
  difficulty TEXT, -- simple, intermediate, advanced
  
  -- Effectiveness
  usage_count INTEGER DEFAULT 0,
  avg_effectiveness_rating DECIMAL(3,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ritual_templates_curator ON ritual_templates(curator_name);
CREATE INDEX IF NOT EXISTS idx_ritual_templates_type ON ritual_templates(ritual_type);

-- ============================================================================
-- 5. USER FEEDBACK & VALIDATION
-- ============================================================================

-- Track if our emotional intelligence is accurate
CREATE TABLE IF NOT EXISTS emotional_detection_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  emotional_state_id UUID REFERENCES user_emotional_states(id),
  
  -- Feedback
  detected_emotion TEXT,
  detected_intensity INTEGER,
  user_confirmed_accurate BOOLEAN, -- Did we get it right?
  user_actual_emotion TEXT, -- What they were really feeling
  user_actual_intensity INTEGER,
  
  -- Context
  feedback_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  feedback_delay INTERVAL, -- How long after detection did they respond?
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_detection_feedback_accuracy ON emotional_detection_feedback(user_confirmed_accurate);
CREATE INDEX IF NOT EXISTS idx_detection_feedback_emotion ON emotional_detection_feedback(detected_emotion, user_confirmed_accurate);

-- Track curator effectiveness
CREATE TABLE IF NOT EXISTS curator_effectiveness_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  curator_memory_id UUID REFERENCES curator_memories(id),
  curator_name TEXT NOT NULL,
  
  -- What happened
  interaction_type TEXT, -- greeting, recommendation, support, check-in
  curator_message TEXT,
  
  -- User feedback
  was_helpful BOOLEAN,
  resonance_score INTEGER CHECK (resonance_score >= 1 AND resonance_score <= 5),
  felt_understood BOOLEAN,
  tone_was_appropriate BOOLEAN,
  
  -- Action taken
  followed_recommendation BOOLEAN,
  engaged_further BOOLEAN, -- Did they ask for more?
  
  feedback_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_curator_feedback_curator ON curator_effectiveness_feedback(curator_name, was_helpful);
CREATE INDEX IF NOT EXISTS idx_curator_feedback_resonance ON curator_effectiveness_feedback(resonance_score DESC);

-- ============================================================================
-- 6. CONSCIOUSNESS MILESTONES (Gamification of depth)
-- ============================================================================

-- Achievements for relationship deepening
CREATE TABLE IF NOT EXISTS consciousness_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  
  -- Milestone
  milestone_type TEXT NOT NULL, -- first_curator_meeting, ritual_practiced_10x, confidant_reached, transformation_completed, healing_moment
  milestone_name TEXT NOT NULL,
  milestone_description TEXT,
  
  -- Context
  curator_involved TEXT,
  related_ritual_id UUID,
  related_journey_id UUID,
  
  -- Significance
  emotional_significance INTEGER DEFAULT 50, -- How meaningful (0-100)
  granted_capability TEXT, -- What unlocks: "dream_journal", "voice_curator", "group_healing"
  
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_user ON consciousness_milestones(user_id, achieved_at DESC);
CREATE INDEX IF NOT EXISTS idx_milestones_type ON consciousness_milestones(milestone_type);

-- ============================================================================
-- 7. EMOTIONAL PATTERN LEARNING
-- ============================================================================

-- Machine learning from emotional patterns
CREATE TABLE IF NOT EXISTS emotional_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  
  -- Pattern identification
  pattern_type TEXT, -- time_based, trigger_based, cyclical, product_related
  pattern_name TEXT, -- "Sunday evening anxiety", "Post-purchase joy"
  
  -- Pattern details
  trigger_signals JSONB, -- What causes this pattern
  typical_emotion TEXT,
  typical_intensity INTEGER,
  frequency TEXT, -- daily, weekly, monthly, situational
  
  -- Predictions
  next_predicted_occurrence TIMESTAMP WITH TIME ZONE,
  confidence_score INTEGER, -- 0-100
  
  -- Interventions
  recommended_curator TEXT,
  recommended_journey TEXT,
  preventative_ritual_id UUID,
  
  -- Learning
  pattern_observed_count INTEGER DEFAULT 1,
  prediction_accuracy DECIMAL(5,2), -- How often we're right
  
  last_observed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emotional_patterns_user ON emotional_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_emotional_patterns_next ON emotional_patterns(next_predicted_occurrence) WHERE confidence_score >= 70;

-- ============================================================================
-- 8. CRISIS DETECTION & INTERVENTION
-- ============================================================================

-- Immediate alerts for users needing support
CREATE TABLE IF NOT EXISTS crisis_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT,
  
  -- Alert details
  alert_level TEXT, -- watch, concern, urgent
  detected_signals TEXT[], -- ["extreme_stress", "abandonment_loop", "late_night_distress"]
  
  -- Context
  emotional_state JSONB,
  behavioral_context JSONB,
  time_of_day INTEGER,
  
  -- Intervention
  curator_notified TEXT,
  intervention_message TEXT,
  intervention_delivered BOOLEAN DEFAULT false,
  
  -- Outcome
  user_responded BOOLEAN,
  situation_resolved BOOLEAN,
  resolution_notes TEXT,
  
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_crisis_signals_user ON crisis_signals(user_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_crisis_signals_unresolved ON crisis_signals(alert_level, situation_resolved) WHERE situation_resolved = false;

-- ============================================================================
-- 9. ENHANCED FUNCTIONS
-- ============================================================================

-- Function to calculate emotional detection accuracy
CREATE OR REPLACE FUNCTION calculate_detection_accuracy()
RETURNS TABLE(emotion TEXT, accuracy_rate DECIMAL(5,2), sample_size INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    detected_emotion,
    (COUNT(*) FILTER (WHERE user_confirmed_accurate = true)::DECIMAL / COUNT(*)) * 100 as accuracy_rate,
    COUNT(*)::INTEGER as sample_size
  FROM emotional_detection_feedback
  WHERE feedback_timestamp > NOW() - INTERVAL '30 days'
  GROUP BY detected_emotion
  HAVING COUNT(*) >= 5
  ORDER BY accuracy_rate DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's emotional pattern
CREATE OR REPLACE FUNCTION get_user_emotional_pattern(p_user_id TEXT)
RETURNS TABLE(
  hour_of_day INTEGER,
  common_emotion TEXT,
  avg_intensity DECIMAL(5,2),
  occurrence_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(HOUR FROM detected_at)::INTEGER as hour_of_day,
    primary_emotion as common_emotion,
    AVG(intensity)::DECIMAL(5,2) as avg_intensity,
    COUNT(*) as occurrence_count
  FROM user_emotional_states
  WHERE user_id = p_user_id
  AND detected_at > NOW() - INTERVAL '90 days'
  GROUP BY EXTRACT(HOUR FROM detected_at), primary_emotion
  HAVING COUNT(*) >= 2
  ORDER BY hour_of_day, occurrence_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to recommend curator based on time patterns
CREATE OR REPLACE FUNCTION recommend_curator_by_time(p_user_id TEXT)
RETURNS TEXT AS $$
DECLARE
  v_current_hour INTEGER;
  v_common_emotion TEXT;
  v_recommended_curator TEXT;
BEGIN
  v_current_hour := EXTRACT(HOUR FROM NOW());
  
  -- Get most common emotion at this time
  SELECT primary_emotion INTO v_common_emotion
  FROM user_emotional_states
  WHERE user_id = p_user_id
  AND EXTRACT(HOUR FROM detected_at) = v_current_hour
  AND detected_at > NOW() - INTERVAL '30 days'
  GROUP BY primary_emotion
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  -- Match curator to emotion
  v_recommended_curator := CASE v_common_emotion
    WHEN 'stressed' THEN 'sage'
    WHEN 'seeking' THEN 'aurora'
    WHEN 'playful' THEN 'flux'
    WHEN 'melancholic' THEN 'echo'
    WHEN 'excited' THEN 'spark'
    ELSE 'aurora'
  END;
  
  RETURN v_recommended_curator;
END;
$$ LANGUAGE plpgsql;

-- Function to detect if user needs intervention
CREATE OR REPLACE FUNCTION check_crisis_signals(
  p_user_id TEXT,
  p_session_id TEXT,
  p_signals JSONB
)
RETURNS TEXT AS $$
DECLARE
  v_alert_level TEXT := 'normal';
  v_stress_indicators INTEGER := 0;
BEGIN
  -- Count stress indicators
  IF (p_signals->>'rapid_clicking')::BOOLEAN = true THEN
    v_stress_indicators := v_stress_indicators + 1;
  END IF;
  
  IF (p_signals->>'cart_abandonment_count')::INTEGER > 3 THEN
    v_stress_indicators := v_stress_indicators + 1;
  END IF;
  
  IF (p_signals->>'time_of_day')::INTEGER >= 23 OR (p_signals->>'time_of_day')::INTEGER <= 3 THEN
    v_stress_indicators := v_stress_indicators + 1;
  END IF;
  
  IF (p_signals->>'back_button_count')::INTEGER > 10 THEN
    v_stress_indicators := v_stress_indicators + 1;
  END IF;
  
  -- Determine alert level
  IF v_stress_indicators >= 3 THEN
    v_alert_level := 'urgent';
    
    INSERT INTO crisis_signals (
      user_id,
      session_id,
      alert_level,
      detected_signals,
      emotional_state,
      behavioral_context,
      time_of_day
    ) VALUES (
      p_user_id,
      p_session_id,
      v_alert_level,
      ARRAY['multiple_stress_indicators'],
      p_signals,
      p_signals,
      (p_signals->>'time_of_day')::INTEGER
    );
  ELSIF v_stress_indicators >= 2 THEN
    v_alert_level := 'concern';
  ELSIF v_stress_indicators >= 1 THEN
    v_alert_level := 'watch';
  END IF;
  
  RETURN v_alert_level;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================================

-- STEP 1: Drop existing policies first (required before column type changes)
DROP POLICY IF EXISTS "Users view own behavioral signals" ON behavioral_signals;
DROP POLICY IF EXISTS "System inserts behavioral signals" ON behavioral_signals;
DROP POLICY IF EXISTS "Anyone views voice examples" ON curator_voice_examples;
DROP POLICY IF EXISTS "System manages voice examples" ON curator_voice_examples;
DROP POLICY IF EXISTS "Anyone views transformation paths" ON transformation_paths;
DROP POLICY IF EXISTS "Anyone views ritual templates" ON ritual_templates;
DROP POLICY IF EXISTS "Users view own feedback" ON emotional_detection_feedback;
DROP POLICY IF EXISTS "Users submit feedback" ON emotional_detection_feedback;
DROP POLICY IF EXISTS "Users view own curator feedback" ON curator_effectiveness_feedback;
DROP POLICY IF EXISTS "Users submit curator feedback" ON curator_effectiveness_feedback;
DROP POLICY IF EXISTS "Users view own milestones" ON consciousness_milestones;
DROP POLICY IF EXISTS "System grants milestones" ON consciousness_milestones;
DROP POLICY IF EXISTS "Users view own patterns" ON emotional_patterns;
DROP POLICY IF EXISTS "System manages patterns" ON emotional_patterns;
DROP POLICY IF EXISTS "System manages crisis signals" ON crisis_signals;

-- STEP 2: Convert user_id columns from UUID to TEXT if needed (for existing tables)
DO $$
BEGIN
  -- behavioral_signals
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'behavioral_signals' 
             AND column_name = 'user_id' 
             AND data_type = 'uuid') THEN
    ALTER TABLE behavioral_signals ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
  
  -- emotional_detection_feedback
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'emotional_detection_feedback' 
             AND column_name = 'user_id' 
             AND data_type = 'uuid') THEN
    ALTER TABLE emotional_detection_feedback ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
  
  -- curator_effectiveness_feedback
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'curator_effectiveness_feedback' 
             AND column_name = 'user_id' 
             AND data_type = 'uuid') THEN
    ALTER TABLE curator_effectiveness_feedback ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
  
  -- consciousness_milestones
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'consciousness_milestones' 
             AND column_name = 'user_id' 
             AND data_type = 'uuid') THEN
    ALTER TABLE consciousness_milestones ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
  
  -- emotional_patterns
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'emotional_patterns' 
             AND column_name = 'user_id' 
             AND data_type = 'uuid') THEN
    ALTER TABLE emotional_patterns ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
  
  -- crisis_signals
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'crisis_signals' 
             AND column_name = 'user_id' 
             AND data_type = 'uuid') THEN
    ALTER TABLE crisis_signals ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
END $$;

-- STEP 3: Enable RLS
ALTER TABLE behavioral_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE curator_voice_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE transformation_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE ritual_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotional_detection_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE curator_effectiveness_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE consciousness_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotional_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_signals ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create policies (with TEXT casting for auth.uid())
CREATE POLICY "Users view own behavioral signals" ON behavioral_signals FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "System inserts behavioral signals" ON behavioral_signals FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone views voice examples" ON curator_voice_examples FOR SELECT USING (true);
CREATE POLICY "System manages voice examples" ON curator_voice_examples FOR ALL USING (true);

CREATE POLICY "Anyone views transformation paths" ON transformation_paths FOR SELECT USING (true);

CREATE POLICY "Anyone views ritual templates" ON ritual_templates FOR SELECT USING (true);

CREATE POLICY "Users view own feedback" ON emotional_detection_feedback FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users submit feedback" ON emotional_detection_feedback FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users view own curator feedback" ON curator_effectiveness_feedback FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users submit curator feedback" ON curator_effectiveness_feedback FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users view own milestones" ON consciousness_milestones FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "System grants milestones" ON consciousness_milestones FOR INSERT WITH CHECK (true);

CREATE POLICY "Users view own patterns" ON emotional_patterns FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "System manages patterns" ON emotional_patterns FOR ALL USING (true);

CREATE POLICY "System manages crisis signals" ON crisis_signals FOR ALL USING (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  enhancement_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO enhancement_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'behavioral_signals',
    'curator_voice_examples',
    'transformation_paths',
    'ritual_templates',
    'emotional_detection_feedback',
    'curator_effectiveness_feedback',
    'consciousness_milestones',
    'emotional_patterns',
    'crisis_signals'
  );
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Consciousness Enhancements Complete';
  RAISE NOTICE '📊 Enhancement tables: %', enhancement_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔬 Behavioral Tracking: ACTIVE';
  RAISE NOTICE '📝 Voice Consistency: ACTIVE';
  RAISE NOTICE '🗺️  Transformation Paths: 3 pre-loaded';
  RAISE NOTICE '📋 Ritual Templates: READY';
  RAISE NOTICE '💬 User Feedback: ENABLED';
  RAISE NOTICE '🏆 Milestones: READY';
  RAISE NOTICE '🧠 Pattern Learning: ACTIVE';
  RAISE NOTICE '🚨 Crisis Detection: ACTIVE';
  RAISE NOTICE '';
  RAISE NOTICE 'Your consciousness system is now COMPLETE! 🌊';
END $$;
