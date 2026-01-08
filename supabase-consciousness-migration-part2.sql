-- ============================================================================
-- AI CITY CONSCIOUSNESS LAYER MIGRATION - PART 2
-- Policies, Functions, and Triggers
-- Run AFTER part1.sql
-- ============================================================================

-- ============================================================================
-- DROP EXISTING POLICIES FIRST (so we can modify columns if needed)
-- ============================================================================

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

-- ============================================================================
-- ENSURE user_id COLUMNS ARE TEXT TYPE
-- ============================================================================

-- Change user_id from UUID to TEXT if needed
DO $$
BEGIN
  -- user_emotional_states
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'user_emotional_states' 
             AND column_name = 'user_id' 
             AND data_type = 'uuid') THEN
    ALTER TABLE user_emotional_states ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
  
  -- curator_memories
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'curator_memories' 
             AND column_name = 'user_id' 
             AND data_type = 'uuid') THEN
    ALTER TABLE curator_memories ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
  
  -- personal_rituals
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'personal_rituals' 
             AND column_name = 'user_id' 
             AND data_type = 'uuid') THEN
    ALTER TABLE personal_rituals ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
  
  -- transformation_journeys
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'transformation_journeys' 
             AND column_name = 'user_id' 
             AND data_type = 'uuid') THEN
    ALTER TABLE transformation_journeys ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
  
  -- healing_moments
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'healing_moments' 
             AND column_name = 'user_id' 
             AND data_type = 'uuid') THEN
    ALTER TABLE healing_moments ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE user_emotional_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE curator_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_rituals ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_emotional_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE transformation_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE consciousness_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE healing_moments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own emotional states" ON user_emotional_states
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can insert emotional states" ON user_emotional_states
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own curator memories" ON curator_memories
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can manage curator memories" ON curator_memories
  FOR ALL USING (true);

CREATE POLICY "Users can view own rituals" ON personal_rituals
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can create rituals" ON personal_rituals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own rituals" ON personal_rituals
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Anyone can view emotional scores" ON product_emotional_scores
  FOR SELECT USING (true);

CREATE POLICY "System can manage emotional scores" ON product_emotional_scores
  FOR ALL USING (true);

CREATE POLICY "Users can view own journeys" ON transformation_journeys
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can manage journeys" ON transformation_journeys
  FOR ALL USING (true);

CREATE POLICY "Anyone can view consciousness analytics" ON consciousness_analytics
  FOR SELECT USING (true);

CREATE POLICY "System can manage analytics" ON consciousness_analytics
  FOR ALL USING (true);

CREATE POLICY "Users can view own healing moments" ON healing_moments
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can record healing moments" ON healing_moments
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

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
  SELECT 
    interactions_count,
    EXTRACT(DAY FROM (NOW() - first_met)),
    relationship_stage
  INTO v_interactions, v_days_known, v_current_stage
  FROM curator_memories
  WHERE user_id = p_user_id AND curator_name = p_curator_name;
  
  IF v_interactions >= 15 AND v_days_known >= 30 THEN
    v_new_stage := 'confidant';
  ELSIF v_interactions >= 8 AND v_days_known >= 14 THEN
    v_new_stage := 'friend';
  ELSIF v_interactions >= 3 AND v_days_known >= 3 THEN
    v_new_stage := 'acquaintance';
  ELSE
    v_new_stage := 'stranger';
  END IF;
  
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
    
    (SELECT jsonb_object_agg(primary_emotion, count)
     FROM (SELECT primary_emotion, COUNT(*) as count
           FROM user_emotional_states
           WHERE DATE(detected_at) = p_date
           GROUP BY primary_emotion) sq),
    
    (SELECT AVG(intensity)
     FROM user_emotional_states
     WHERE DATE(detected_at) = p_date),
    
    (SELECT jsonb_object_agg(curator_name, interactions)
     FROM (SELECT curator_name, SUM(messages_sent) as interactions
           FROM curator_memories
           WHERE DATE(last_interaction) = p_date
           GROUP BY curator_name) sq),
    
    (SELECT COUNT(*)
     FROM curator_memories
     WHERE DATE(first_met) = p_date),
    
    (SELECT COUNT(*)
     FROM curator_memories
     WHERE DATE(updated_at) = p_date
     AND relationship_stage IN ('acquaintance', 'friend', 'confidant')),
    
    (SELECT COUNT(*)
     FROM personal_rituals
     WHERE DATE(created_at) = p_date),
    
    (SELECT COUNT(*)
     FROM personal_rituals
     WHERE DATE(last_practiced) = p_date),
    
    (SELECT AVG(effectiveness_rating)
     FROM personal_rituals
     WHERE effectiveness_rating IS NOT NULL
     AND DATE(last_practiced) = p_date),
    
    (SELECT COUNT(*)
     FROM transformation_journeys
     WHERE DATE(started_at) = p_date),
    
    (SELECT COUNT(*)
     FROM transformation_journeys
     WHERE DATE(completed_at) = p_date
     AND transformation_achieved = true),
    
    (SELECT 
       CASE 
         WHEN COUNT(*) > 0 THEN 
           (COUNT(*) FILTER (WHERE transformation_achieved = true)::DECIMAL / COUNT(*)) * 100
         ELSE 0
       END
     FROM transformation_journeys
     WHERE DATE(completed_at) = p_date),
    
    (SELECT COUNT(*)
     FROM healing_moments
     WHERE DATE(occurred_at) = p_date
     AND significance_score >= 70),
    
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

-- Success!
DO $$
BEGIN
  RAISE NOTICE '✅ Consciousness Layer Migration Complete!';
  RAISE NOTICE '📊 7 tables + 15 policies + 5 functions created';
  RAISE NOTICE '🌊 Emotional Intelligence: ACTIVE';
  RAISE NOTICE '👥 AI Curator System: ACTIVE';
  RAISE NOTICE '✨ Transformation Journeys: READY';
END $$;
