-- Autonomous System Database Schema
-- Tables to support self-evolving AI features

-- Learning Signals Table
CREATE TABLE IF NOT EXISTS learning_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type TEXT NOT NULL, -- 'performance', 'user_behavior', 'anomaly', 'opportunity'
  entity_type TEXT NOT NULL, -- 'product', 'district', 'vendor', 'system'
  entity_id TEXT,
  data JSONB NOT NULL,
  priority INTEGER DEFAULT 50, -- 0-100
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_signals_type ON learning_signals(signal_type);
CREATE INDEX idx_learning_signals_processed ON learning_signals(processed);
CREATE INDEX idx_learning_signals_priority ON learning_signals(priority DESC);

-- Autonomous Tasks Table
CREATE TABLE IF NOT EXISTS autonomous_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT NOT NULL, -- 'optimization', 'evolution', 'content_generation', 'healing', 'analysis'
  entity_type TEXT,
  entity_id TEXT,
  priority INTEGER DEFAULT 50,
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  task_data JSONB,
  result JSONB,
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_autonomous_tasks_status ON autonomous_tasks(status);
CREATE INDEX idx_autonomous_tasks_scheduled ON autonomous_tasks(scheduled_for);
CREATE INDEX idx_autonomous_tasks_type ON autonomous_tasks(task_type);

-- Autonomous Insights Table
CREATE TABLE IF NOT EXISTS autonomous_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL, -- 'trend', 'anomaly', 'opportunity', 'warning'
  title TEXT NOT NULL,
  description TEXT,
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  impact TEXT, -- 'critical', 'high', 'medium', 'low'
  suggested_actions JSONB,
  metrics JSONB,
  entity_type TEXT,
  entity_id TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_autonomous_insights_type ON autonomous_insights(insight_type);
CREATE INDEX idx_autonomous_insights_impact ON autonomous_insights(impact);

-- Merchandising Rules Table
CREATE TABLE IF NOT EXISTS merchandising_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  microstore_id UUID REFERENCES microstores(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL, -- 'boost', 'demote', 'pin', 'hide'
  condition JSONB NOT NULL, -- { "tags": ["featured"], "price": { "min": 0, "max": 100 } }
  action JSONB NOT NULL, -- { "score_modifier": 50 }
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  auto_generated BOOLEAN DEFAULT FALSE,
  performance_metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_merchandising_rules_microstore ON merchandising_rules(microstore_id);
CREATE INDEX idx_merchandising_rules_active ON merchandising_rules(active);

-- A/B Tests Table
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name TEXT NOT NULL,
  test_type TEXT NOT NULL, -- 'product_order', 'layout', 'merchandising'
  entity_type TEXT,
  entity_id TEXT,
  variant_a JSONB NOT NULL,
  variant_b JSONB NOT NULL,
  status TEXT DEFAULT 'running', -- 'running', 'completed', 'cancelled'
  winner TEXT, -- 'a', 'b', 'inconclusive'
  confidence DECIMAL(3,2),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_ab_tests_status ON ab_tests(status);

-- A/B Test Results Table
CREATE TABLE IF NOT EXISTS ab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
  variant TEXT NOT NULL, -- 'a' or 'b'
  user_id TEXT,
  metric_name TEXT NOT NULL, -- 'clicks', 'conversions', 'revenue'
  metric_value DECIMAL(10,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ab_test_results_test ON ab_test_results(test_id);
CREATE INDEX idx_ab_test_results_variant ON ab_test_results(variant);

-- Optimization Log Table
CREATE TABLE IF NOT EXISTS optimization_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  optimization_type TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  strategy JSONB,
  performance_before JSONB,
  performance_after JSONB,
  ai_reasoning TEXT,
  optimized_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_optimization_log_entity ON optimization_log(entity_type, entity_id);
CREATE INDEX idx_optimization_log_type ON optimization_log(optimization_type);

-- District Layouts Table
CREATE TABLE IF NOT EXISTS district_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  microstore_id UUID REFERENCES microstores(id) ON DELETE CASCADE,
  layout_config JSONB NOT NULL,
  performance_metrics JSONB,
  ai_generated BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_district_layouts_microstore ON district_layouts(microstore_id);
CREATE INDEX idx_district_layouts_active ON district_layouts(active);

-- District Personalities Table
CREATE TABLE IF NOT EXISTS district_personalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  microstore_id UUID REFERENCES microstores(id) ON DELETE CASCADE,
  tone TEXT,
  style TEXT,
  target_audience TEXT,
  brand_voice TEXT,
  visual_theme TEXT,
  voice_evolution_history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_district_personalities_microstore ON district_personalities(microstore_id);

-- District Marketing Table
CREATE TABLE IF NOT EXISTS district_marketing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  microstore_id UUID REFERENCES microstores(id) ON DELETE CASCADE,
  headline TEXT,
  subheadline TEXT,
  cta TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- District SEO Table
CREATE TABLE IF NOT EXISTS district_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  microstore_id UUID REFERENCES microstores(id) ON DELETE CASCADE,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[],
  og_title TEXT,
  og_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evolution Log Table
CREATE TABLE IF NOT EXISTS evolution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  plan JSONB NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evolution_log_entity ON evolution_log(entity_type, entity_id);

-- District Marketing Content Table
CREATE TABLE IF NOT EXISTS district_marketing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  microstore_id UUID REFERENCES microstores(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Issues Table
CREATE TABLE IF NOT EXISTS health_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  description TEXT,
  auto_fixed BOOLEAN DEFAULT FALSE,
  fix_applied TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_health_issues_severity ON health_issues(severity);
CREATE INDEX idx_health_issues_resolved ON health_issues(resolved_at);

-- Social Calendars Table
CREATE TABLE IF NOT EXISTS social_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  microstore_id UUID REFERENCES microstores(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  calendar_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_social_calendars_microstore ON social_calendars(microstore_id);

-- Scheduled Social Posts Table
CREATE TABLE IF NOT EXISTS scheduled_social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  microstore_id UUID REFERENCES microstores(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'tiktok', 'instagram', 'twitter', 'facebook'
  content TEXT NOT NULL,
  hashtags TEXT[],
  media_url TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  posted BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_posts_microstore ON scheduled_social_posts(microstore_id);
CREATE INDEX idx_scheduled_posts_scheduled ON scheduled_social_posts(scheduled_for);
CREATE INDEX idx_scheduled_posts_posted ON scheduled_social_posts(posted);

-- Analytics Narratives Table
CREATE TABLE IF NOT EXISTS analytics_narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  microstore_id UUID REFERENCES microstores(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- 'day', 'week', 'month'
  narrative JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_narratives_microstore ON analytics_narratives(microstore_id);

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  profile_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user ON user_profiles(user_id);

-- Personalized Layouts Table
CREATE TABLE IF NOT EXISTS personalized_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  layout_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_personalized_layouts_user ON personalized_layouts(user_id);

-- AI Plugins Table
CREATE TABLE IF NOT EXISTS ai_plugins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  capabilities TEXT[],
  enabled BOOLEAN DEFAULT TRUE,
  config JSONB,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_plugins_enabled ON ai_plugins(enabled);

-- Database Functions for autonomous systems

-- Find orphaned products
CREATE OR REPLACE FUNCTION find_orphaned_products()
RETURNS TABLE (id UUID, name TEXT, microstore_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.microstore_id
  FROM products p
  LEFT JOIN microstores m ON p.microstore_id = m.id
  WHERE m.id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Find empty orders
CREATE OR REPLACE FUNCTION find_empty_orders()
RETURNS TABLE (id UUID, created_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.created_at
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  WHERE oi.id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Get products by interests
CREATE OR REPLACE FUNCTION get_products_by_interests(interests TEXT[])
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  relevance_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    (
      SELECT COUNT(*)
      FROM unnest(p.tags) AS tag
      WHERE tag = ANY(interests)
    )::INTEGER AS relevance_score
  FROM products p
  WHERE p.tags && interests
  ORDER BY relevance_score DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON learning_signals TO postgres, anon, authenticated;
GRANT ALL ON autonomous_tasks TO postgres, anon, authenticated;
GRANT ALL ON autonomous_insights TO postgres, anon, authenticated;
GRANT ALL ON merchandising_rules TO postgres, anon, authenticated;
GRANT ALL ON ab_tests TO postgres, anon, authenticated;
GRANT ALL ON ab_test_results TO postgres, anon, authenticated;
GRANT ALL ON optimization_log TO postgres, anon, authenticated;
GRANT ALL ON district_layouts TO postgres, anon, authenticated;
GRANT ALL ON district_personalities TO postgres, anon, authenticated;
GRANT ALL ON district_marketing TO postgres, anon, authenticated;
GRANT ALL ON district_seo TO postgres, anon, authenticated;
GRANT ALL ON evolution_log TO postgres, anon, authenticated;
GRANT ALL ON district_marketing_content TO postgres, anon, authenticated;
GRANT ALL ON health_issues TO postgres, anon, authenticated;
GRANT ALL ON social_calendars TO postgres, anon, authenticated;
GRANT ALL ON scheduled_social_posts TO postgres, anon, authenticated;
GRANT ALL ON analytics_narratives TO postgres, anon, authenticated;
GRANT ALL ON user_profiles TO postgres, anon, authenticated;
GRANT ALL ON personalized_layouts TO postgres, anon, authenticated;
GRANT ALL ON ai_plugins TO postgres, anon, authenticated;
