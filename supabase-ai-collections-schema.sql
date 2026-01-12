-- ============================================================================
-- AI-Curated Collections System
-- ============================================================================
-- This migration adds a dynamic collections system where AI curates
-- product collections based on themes, user behavior, trends, and seasons.
-- Collections are personalized per user and evolve over time.
-- ============================================================================

-- Create collections table
CREATE TABLE IF NOT EXISTS ai_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Collection identity
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  theme TEXT NOT NULL, -- 'wellness', 'tech', 'seasonal', 'trending', 'personalized'
  
  -- AI metadata
  ai_generated BOOLEAN DEFAULT true,
  generation_prompt TEXT, -- The prompt used to generate this collection
  curator_personality TEXT, -- The AI personality that curated it
  curation_reasoning JSONB, -- Why products were selected
  
  -- Product selection
  product_ids UUID[] NOT NULL DEFAULT '{}',
  min_products INTEGER DEFAULT 3,
  max_products INTEGER DEFAULT 8,
  
  -- Display settings
  cover_image_url TEXT,
  color_scheme JSONB, -- {primary: '#hex', secondary: '#hex', accent: '#hex'}
  display_style TEXT DEFAULT 'grid', -- 'grid', 'carousel', 'mosaic', 'story'
  
  -- Status and scheduling
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived', 'expired')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'members_only')),
  active_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active_until TIMESTAMP WITH TIME ZONE,
  
  -- Performance metrics
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  avg_engagement_score DECIMAL(5,2), -- AI-calculated engagement
  
  -- Personalization
  target_user_segments JSONB, -- {demographics, preferences, behavior_patterns}
  affinity_boosters JSONB, -- {hall_affinities, street_preferences, etc}
  
  -- Evolution tracking
  version INTEGER DEFAULT 1,
  parent_collection_id UUID REFERENCES ai_collections(id),
  evolution_history JSONB DEFAULT '[]',
  last_ai_refresh TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID, -- admin user or 'ai-curator'
  
  -- Indexes
  CONSTRAINT collection_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 100)
);

-- Create user-specific collection personalization
CREATE TABLE IF NOT EXISTS user_collection_affinity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  collection_id UUID REFERENCES ai_collections(id) ON DELETE CASCADE,
  
  -- Affinity scores
  affinity_score DECIMAL(5,2) DEFAULT 50.0, -- 0-100
  view_count INTEGER DEFAULT 0,
  click_through_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  
  -- Personalized product ordering within collection
  personalized_product_order UUID[], -- Reordered product_ids based on user preferences
  
  -- Behavioral signals
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  dismissed BOOLEAN DEFAULT false,
  saved BOOLEAN DEFAULT false,
  shared BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, collection_id)
);

-- Collection performance analytics
CREATE TABLE IF NOT EXISTS collection_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES ai_collections(id) ON DELETE CASCADE,
  
  -- Time period
  recorded_date DATE NOT NULL,
  
  -- Engagement metrics
  impressions INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  add_to_carts INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  
  -- Revenue
  revenue DECIMAL(10,2) DEFAULT 0,
  avg_order_value DECIMAL(10,2),
  
  -- Conversion funnel
  view_to_click_rate DECIMAL(5,2),
  click_to_cart_rate DECIMAL(5,2),
  cart_to_purchase_rate DECIMAL(5,2),
  overall_conversion_rate DECIMAL(5,2),
  
  -- AI insights
  ai_performance_grade TEXT, -- 'A', 'B', 'C', 'D', 'F'
  ai_insights JSONB, -- AI-generated insights about performance
  optimization_suggestions JSONB, -- AI suggestions for improvement
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(collection_id, recorded_date)
);

-- Collection evolution log
CREATE TABLE IF NOT EXISTS collection_evolution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES ai_collections(id) ON DELETE CASCADE,
  
  -- Evolution event
  evolution_type TEXT NOT NULL, -- 'created', 'refreshed', 'products_updated', 'theme_changed', 'archived'
  triggered_by TEXT NOT NULL, -- 'ai_curator', 'admin', 'performance_trigger', 'schedule'
  
  -- Changes made
  changes JSONB NOT NULL, -- {before: {}, after: {}, reason: ''}
  ai_reasoning TEXT,
  
  -- Context
  performance_data JSONB, -- Snapshot of performance at time of evolution
  user_feedback_summary JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collections_status ON ai_collections(status);
CREATE INDEX IF NOT EXISTS idx_collections_theme ON ai_collections(theme);
CREATE INDEX IF NOT EXISTS idx_collections_active_dates ON ai_collections(active_from, active_until);
CREATE INDEX IF NOT EXISTS idx_collections_performance ON ai_collections(conversion_count DESC, view_count DESC);
CREATE INDEX IF NOT EXISTS idx_user_affinity_user ON user_collection_affinity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_affinity_collection ON user_collection_affinity(collection_id);
CREATE INDEX IF NOT EXISTS idx_user_affinity_score ON user_collection_affinity(affinity_score DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_collection ON collection_analytics(collection_id, recorded_date DESC);
CREATE INDEX IF NOT EXISTS idx_evolution_collection ON collection_evolution_log(collection_id, created_at DESC);

-- GIN index for JSONB fields
CREATE INDEX IF NOT EXISTS idx_collections_reasoning_gin ON ai_collections USING gin(curation_reasoning);
CREATE INDEX IF NOT EXISTS idx_collections_target_segments_gin ON ai_collections USING gin(target_user_segments);
CREATE INDEX IF NOT EXISTS idx_analytics_insights_gin ON collection_analytics USING gin(ai_insights);

-- Full-text search on collection names and descriptions
CREATE INDEX IF NOT EXISTS idx_collections_search ON ai_collections USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update collection performance metrics
CREATE OR REPLACE FUNCTION update_collection_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update collection stats when analytics are recorded
  UPDATE ai_collections
  SET 
    view_count = view_count + NEW.impressions,
    click_count = click_count + NEW.clicks,
    conversion_count = conversion_count + NEW.purchases,
    revenue_generated = revenue_generated + NEW.revenue,
    updated_at = NOW()
  WHERE id = NEW.collection_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_collection_metrics
  AFTER INSERT ON collection_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_metrics();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_collection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_collection_updated_at
  BEFORE UPDATE ON ai_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_timestamp();

CREATE TRIGGER trigger_user_affinity_updated_at
  BEFORE UPDATE ON user_collection_affinity
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_timestamp();

-- Calculate collection engagement score
CREATE OR REPLACE FUNCTION calculate_collection_engagement(
  p_collection_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS DECIMAL AS $$
DECLARE
  v_engagement_score DECIMAL;
BEGIN
  SELECT 
    CASE 
      WHEN SUM(impressions) = 0 THEN 0
      ELSE (
        (SUM(clicks)::DECIMAL / NULLIF(SUM(impressions), 0) * 30) +
        (SUM(add_to_carts)::DECIMAL / NULLIF(SUM(clicks), 0) * 30) +
        (SUM(purchases)::DECIMAL / NULLIF(SUM(add_to_carts), 0) * 40)
      )
    END
  INTO v_engagement_score
  FROM collection_analytics
  WHERE collection_id = p_collection_id
    AND recorded_date >= CURRENT_DATE - p_days;
    
  RETURN COALESCE(v_engagement_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Get personalized collection recommendations for user
CREATE OR REPLACE FUNCTION get_personalized_collections(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  collection_id UUID,
  collection_name TEXT,
  theme TEXT,
  affinity_score DECIMAL,
  product_ids UUID[],
  description TEXT,
  cover_image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.theme,
    COALESCE(uca.affinity_score, 50.0) as affinity_score,
    COALESCE(uca.personalized_product_order, c.product_ids) as product_ids,
    c.description,
    c.cover_image_url
  FROM ai_collections c
  LEFT JOIN user_collection_affinity uca 
    ON c.id = uca.collection_id AND uca.user_id = p_user_id
  WHERE c.status = 'active'
    AND (c.active_until IS NULL OR c.active_until > NOW())
    AND (uca.dismissed IS NULL OR uca.dismissed = false)
  ORDER BY 
    COALESCE(uca.affinity_score, 50.0) DESC,
    c.conversion_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Track collection view
CREATE OR REPLACE FUNCTION track_collection_view(
  p_user_id UUID,
  p_collection_id UUID,
  p_time_spent_seconds INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  -- Upsert user affinity
  INSERT INTO user_collection_affinity (
    user_id,
    collection_id,
    view_count,
    time_spent_seconds,
    last_viewed_at,
    affinity_score
  )
  VALUES (
    p_user_id,
    p_collection_id,
    1,
    p_time_spent_seconds,
    NOW(),
    55.0
  )
  ON CONFLICT (user_id, collection_id)
  DO UPDATE SET
    view_count = user_collection_affinity.view_count + 1,
    time_spent_seconds = user_collection_affinity.time_spent_seconds + p_time_spent_seconds,
    last_viewed_at = NOW(),
    affinity_score = LEAST(100, user_collection_affinity.affinity_score + 2),
    updated_at = NOW();
    
  -- Update daily analytics
  INSERT INTO collection_analytics (
    collection_id,
    recorded_date,
    impressions,
    unique_viewers
  )
  VALUES (
    p_collection_id,
    CURRENT_DATE,
    1,
    1
  )
  ON CONFLICT (collection_id, recorded_date)
  DO UPDATE SET
    impressions = collection_analytics.impressions + 1,
    unique_viewers = collection_analytics.unique_viewers + 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA - Sample AI Collections
-- ============================================================================

INSERT INTO ai_collections (
  name,
  slug,
  description,
  theme,
  curator_personality,
  curation_reasoning,
  color_scheme,
  active_from,
  active_until
) VALUES
(
  'Mindful Morning Ritual',
  'mindful-morning-ritual',
  'Start your day with intention. Curated essentials for a peaceful, productive morning routine.',
  'wellness',
  'Serenity - The Chapel Spirit of Calm',
  '{"selection_criteria": ["promotes mindfulness", "morning use", "wellness focus"], "target_mood": "peaceful", "user_segment": "wellness enthusiasts"}',
  '{"primary": "#10b981", "secondary": "#059669", "accent": "#fbbf24"}',
  NOW(),
  NOW() + INTERVAL '90 days'
),
(
  'Tech Innovator''s Arsenal',
  'tech-innovators-arsenal',
  'Cutting-edge tools for makers, creators, and digital pioneers. Handpicked by Innovation Hall''s AI.',
  'tech',
  'Prometheus - Innovation Hall Spirit',
  '{"selection_criteria": ["innovation", "productivity", "tech enthusiast"], "target_persona": "maker", "complementary_usage": true}',
  '{"primary": "#3b82f6", "secondary": "#1d4ed8", "accent": "#f59e0b"}',
  NOW(),
  NULL
),
(
  'Cozy Autumn Vibes',
  'cozy-autumn-vibes',
  'Embrace the season with warm textures, ambient lighting, and comforting essentials.',
  'seasonal',
  'Harvest - Seasonal AI Curator',
  '{"selection_criteria": ["autumn aesthetic", "comfort", "warmth", "seasonal relevance"], "season": "fall", "emotional_tone": "cozy"}',
  '{"primary": "#d97706", "secondary": "#92400e", "accent": "#dc2626"}',
  NOW(),
  NOW() + INTERVAL '60 days'
),
(
  'The Minimalist Essentials',
  'minimalist-essentials',
  'Less is more. Thoughtfully selected products that serve multiple purposes and spark joy.',
  'curated',
  'Zen - Contemplation Chapel Spirit',
  '{"selection_criteria": ["multi-functional", "quality over quantity", "timeless design"], "philosophy": "minimalism", "value_prop": "essentialism"}',
  '{"primary": "#6b7280", "secondary": "#374151", "accent": "#f3f4f6"}',
  NOW(),
  NULL
),
(
  'Home Office Productivity Pack',
  'home-office-productivity',
  'Transform your workspace. Everything you need for a focused, comfortable, and inspiring WFH setup.',
  'curated',
  'Focus - Innovation Hall Spirit',
  '{"selection_criteria": ["work from home", "productivity", "ergonomics", "aesthetic workspace"], "use_case": "remote work", "benefits": ["focus", "comfort", "efficiency"]}',
  '{"primary": "#8b5cf6", "secondary": "#6d28d9", "accent": "#06b6d4"}',
  NOW(),
  NULL
);

-- Log creation events
INSERT INTO collection_evolution_log (collection_id, evolution_type, triggered_by, changes, ai_reasoning)
SELECT 
  id,
  'created',
  'ai_curator',
  jsonb_build_object(
    'action', 'initial_creation',
    'product_count', array_length(product_ids, 1)
  ),
  'Initial collection creation based on theme analysis and user behavior patterns.'
FROM ai_collections;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE ai_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collection_affinity ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_evolution_log ENABLE ROW LEVEL SECURITY;

-- Public can read active collections
CREATE POLICY "Public can view active collections" ON ai_collections
  FOR SELECT USING (status = 'active' AND visibility = 'public');

-- Users can read their own affinity data
CREATE POLICY "Users can view their own affinity" ON user_collection_affinity
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can update their own affinity
CREATE POLICY "Users can update their own affinity" ON user_collection_affinity
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Public can read analytics (for transparency)
CREATE POLICY "Public can view collection analytics" ON collection_analytics
  FOR SELECT USING (true);

-- Public can view evolution history (for transparency)
CREATE POLICY "Public can view evolution log" ON collection_evolution_log
  FOR SELECT USING (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ai_collections IS 'AI-curated product collections that evolve based on user behavior and performance';
COMMENT ON TABLE user_collection_affinity IS 'Per-user personalization and engagement with collections';
COMMENT ON TABLE collection_analytics IS 'Daily performance metrics for each collection';
COMMENT ON TABLE collection_evolution_log IS 'Audit trail of how collections change over time';

COMMENT ON FUNCTION calculate_collection_engagement IS 'Calculates engagement score (0-100) based on conversion funnel performance';
COMMENT ON FUNCTION get_personalized_collections IS 'Returns collections sorted by user affinity and relevance';
COMMENT ON FUNCTION track_collection_view IS 'Records a collection view and updates user affinity score';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
