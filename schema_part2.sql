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

-- Functions moved to after table creation

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
