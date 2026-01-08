-- =====================================================
-- AI CITY v5.1 - SEED DATA
-- Sample data for AI Concierge, Live Events, Subscriptions
-- =====================================================

-- Note: Run this AFTER the schema migration
-- This assumes you have existing users and creator_storefronts

-- =====================================================
-- 1. AI SHOPPING CONCIERGE SEED DATA
-- =====================================================

-- Sample Shopping Agents (3 demo users)
INSERT INTO shopping_agents (user_id, agent_name, personality, style_preferences, budget_range, favorite_categories, color_preferences, total_interactions, recommendation_accuracy, active) VALUES
('demo-user-1', 'Ava', 'helpful', 
 '{"style": "modern", "occasion": "casual"}', 
 '{"min": 20, "max": 100}', 
 ARRAY['fashion', 'jewelry', 'beauty'], 
 ARRAY['blue', 'purple', 'gold'],
 25, 0.85, true),

('demo-user-2', 'Leo', 'enthusiastic', 
 '{"style": "minimalist", "occasion": "professional"}', 
 '{"min": 50, "max": 300}', 
 ARRAY['tech', 'home', 'art'], 
 ARRAY['black', 'white', 'silver'],
 42, 0.78, true),

('demo-user-3', 'Maya', 'friendly', 
 '{"style": "bohemian", "occasion": "gifts"}', 
 '{"min": 10, "max": 75}', 
 ARRAY['craft', 'wellness', 'art'], 
 ARRAY['earth-tones', 'pastels', 'green'],
 18, 0.92, true);

-- Sample Agent Conversations
WITH agents AS (SELECT id, user_id FROM shopping_agents LIMIT 3)
INSERT INTO agent_conversations (agent_id, user_id, message_type, message, intent) 
SELECT 
  id, 
  user_id, 
  'user', 
  'Show me some handmade jewelry under $50',
  'product_search'
FROM agents
LIMIT 1;

WITH agents AS (SELECT id, user_id FROM shopping_agents LIMIT 3)
INSERT INTO agent_conversations (agent_id, user_id, message_type, message) 
SELECT 
  id, 
  user_id, 
  'agent', 
  'I found 3 beautiful handmade pieces that match your style! Check out these artisan necklaces...'
FROM agents
LIMIT 1;

-- =====================================================
-- 2. LIVE SHOPPING EVENTS SEED DATA
-- =====================================================

-- Sample Live Events (assuming creator_storefronts exist)
-- You'll need to replace the creator_id values with actual IDs from your database
DO $$
DECLARE
  creator1_id UUID;
  creator2_id UUID;
  creator3_id UUID;
BEGIN
  -- Get first 3 creator IDs (adjust if needed)
  SELECT id INTO creator1_id FROM creator_storefronts ORDER BY created_at LIMIT 1;
  SELECT id INTO creator2_id FROM creator_storefronts ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO creator3_id FROM creator_storefronts ORDER BY created_at LIMIT 1 OFFSET 2;

  -- Insert sample live events if creators exist
  IF creator1_id IS NOT NULL THEN
    INSERT INTO live_shopping_events (
      creator_id, title, description, cover_image,
      scheduled_start, scheduled_end, status,
      event_discount_percent, viewers_peak, viewers_total
    ) VALUES (
      creator1_id,
      'New Collection Launch - Live Demo',
      'Join me as I showcase my latest handcrafted jewelry collection! Exclusive 20% discount for live viewers.',
      'https://images.unsplash.com/photo-1556761175-b413da4baf72',
      NOW() + INTERVAL '2 days',
      NOW() + INTERVAL '2 days 1 hour',
      'scheduled',
      20,
      0,
      0
    );
  END IF;

  IF creator2_id IS NOT NULL THEN
    INSERT INTO live_shopping_events (
      creator_id, title, description, cover_image,
      scheduled_start, scheduled_end, status,
      event_discount_percent, viewers_peak, viewers_total, messages_count, sales_count
    ) VALUES (
      creator2_id,
      'Behind the Scenes: Artisan Workshop Tour',
      'See how I create my products from start to finish. Ask me anything!',
      'https://images.unsplash.com/photo-1452860606245-08befc0ff44b',
      NOW() - INTERVAL '2 hours',
      NOW() + INTERVAL '1 hour',
      'live',
      15,
      127,
      543,
      89,
      14
    );
  END IF;

  IF creator3_id IS NOT NULL THEN
    INSERT INTO live_shopping_events (
      creator_id, title, description, cover_image,
      scheduled_start, scheduled_end, actual_start, actual_end, status,
      event_discount_percent, viewers_peak, viewers_total, messages_count, sales_count, revenue_generated
    ) VALUES (
      creator3_id,
      'Holiday Gift Ideas - Interactive Shopping',
      'Perfect gifts for everyone on your list! Plus surprise giveaways throughout the stream.',
      'https://images.unsplash.com/photo-1513885535751-8b9238bd345a',
      NOW() - INTERVAL '3 days',
      NOW() - INTERVAL '3 days 1 hour',
      NOW() - INTERVAL '3 days',
      NOW() - INTERVAL '3 days 1 hour',
      'ended',
      25,
      284,
      1247,
      156,
      42,
      3850.00
    );
  END IF;
END $$;

-- Sample Event Chat Messages (for the live event)
WITH live_event AS (
  SELECT id FROM live_shopping_events WHERE status = 'live' LIMIT 1
)
INSERT INTO event_chat_messages (event_id, user_id, message, message_type)
SELECT 
  id,
  'demo-user-1',
  'This is amazing! Love the craftsmanship 🎨',
  'text'
FROM live_event
WHERE id IS NOT NULL;

WITH live_event AS (
  SELECT id FROM live_shopping_events WHERE status = 'live' LIMIT 1
)
INSERT INTO event_chat_messages (event_id, user_id, message, message_type)
SELECT 
  id,
  'demo-user-2',
  'How long does shipping take?',
  'text'
FROM live_event
WHERE id IS NOT NULL;

-- =====================================================
-- 3. SUBSCRIPTION BOXES SEED DATA
-- =====================================================

-- Sample Subscription Plans (assuming creators exist)
DO $$
DECLARE
  creator1_id UUID;
  creator2_id UUID;
  creator3_id UUID;
BEGIN
  SELECT id INTO creator1_id FROM creator_storefronts ORDER BY created_at LIMIT 1;
  SELECT id INTO creator2_id FROM creator_storefronts ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO creator3_id FROM creator_storefronts ORDER BY created_at LIMIT 1 OFFSET 2;

  IF creator1_id IS NOT NULL THEN
    INSERT INTO subscription_plans (
      creator_id, name, description, tagline, image_url,
      price_monthly, price_quarterly, price_annual,
      products_per_box, estimated_value,
      shipping_included, exclusive_products, early_access,
      allow_preferences, skip_allowed, cancel_anytime,
      active, subscribers_count, retention_rate
    ) VALUES (
      creator1_id,
      'Artisan Jewelry Box',
      'Receive 3-4 handcrafted jewelry pieces every month, curated just for you. Each box includes exclusive designs you won''t find anywhere else.',
      'Wear unique, feel amazing ✨',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908',
      39.99,
      108.00,
      420.00,
      4,
      85.00,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      127,
      0.82
    );
  END IF;

  IF creator2_id IS NOT NULL THEN
    INSERT INTO subscription_plans (
      creator_id, name, description, tagline, image_url,
      price_monthly, price_quarterly, price_annual,
      products_per_box, estimated_value,
      shipping_included, exclusive_products,
      allow_preferences, skip_allowed, cancel_anytime,
      active, subscribers_count, retention_rate, spots_available
    ) VALUES (
      creator2_id,
      'Wellness Ritual Box',
      'Monthly self-care essentials including aromatherapy, natural skincare, and mindfulness tools.',
      'Your monthly moment of zen 🧘‍♀️',
      'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c',
      49.99,
      135.00,
      540.00,
      5,
      110.00,
      true,
      false,
      true,
      true,
      true,
      true,
      89,
      0.76,
      150
    );
  END IF;

  IF creator3_id IS NOT NULL THEN
    INSERT INTO subscription_plans (
      creator_id, name, description, tagline, image_url,
      price_monthly, price_quarterly, price_annual,
      products_per_box, estimated_value,
      shipping_included, exclusive_products, early_access,
      allow_preferences, preference_categories, skip_allowed, cancel_anytime,
      active, subscribers_count, retention_rate
    ) VALUES (
      creator3_id,
      'Home Decor Surprise',
      'Transform your space with curated home decor, candles, and lifestyle items. Each month brings a new aesthetic!',
      'Beautiful spaces, happy places 🏡',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f',
      44.99,
      120.00,
      480.00,
      3,
      95.00,
      true,
      true,
      true,
      true,
      ARRAY['minimalist', 'bohemian', 'modern', 'rustic'],
      true,
      true,
      true,
      203,
      0.88
    );
  END IF;
END $$;

-- Sample User Subscriptions (for demo users)
DO $$
DECLARE
  plan1_id UUID;
  plan2_id UUID;
BEGIN
  SELECT id INTO plan1_id FROM subscription_plans ORDER BY created_at LIMIT 1;
  SELECT id INTO plan2_id FROM subscription_plans ORDER BY created_at LIMIT 1 OFFSET 1;

  IF plan1_id IS NOT NULL THEN
    INSERT INTO user_subscriptions (
      plan_id, user_id, billing_cycle, price_paid, status,
      start_date, next_billing_date,
      shipping_address, user_preferences,
      boxes_received, lifetime_value
    ) VALUES (
      plan1_id,
      'demo-user-1',
      'monthly',
      39.99,
      'active',
      CURRENT_DATE - INTERVAL '3 months',
      CURRENT_DATE + INTERVAL '1 month',
      '{"street": "123 Main St", "city": "San Francisco", "state": "CA", "zip": "94102", "country": "US"}',
      '{"metal_preference": "gold", "style": "bohemian"}',
      3,
      119.97
    );
  END IF;

  IF plan2_id IS NOT NULL THEN
    INSERT INTO user_subscriptions (
      plan_id, user_id, billing_cycle, price_paid, status,
      start_date, next_billing_date,
      shipping_address, user_preferences,
      boxes_received, lifetime_value
    ) VALUES (
      plan2_id,
      'demo-user-2',
      'quarterly',
      135.00,
      'active',
      CURRENT_DATE - INTERVAL '6 months',
      CURRENT_DATE + INTERVAL '2 months',
      '{"street": "456 Oak Ave", "city": "Portland", "state": "OR", "zip": "97201", "country": "US"}',
      '{"scent_preference": "lavender", "skin_type": "sensitive"}',
      2,
      270.00
    );
  END IF;
END $$;

-- Sample Subscription Boxes (past deliveries)
DO $$
DECLARE
  sub1_id UUID;
  sub1_plan_id UUID;
BEGIN
  SELECT id, plan_id INTO sub1_id, sub1_plan_id FROM user_subscriptions ORDER BY created_at LIMIT 1;

  IF sub1_id IS NOT NULL THEN
    -- November Box (delivered)
    INSERT INTO subscription_boxes (
      subscription_id, plan_id, box_number, month, year,
      theme, theme_description,
      products, total_value, status,
      tracking_number, carrier, shipped_at, delivered_at,
      rating, review_text, reviewed_at
    ) VALUES (
      sub1_id,
      sub1_plan_id,
      1,
      'November',
      2025,
      'Autumn Glow',
      'Warm, earthy tones inspired by fall foliage',
      '[{"name": "Amber Necklace", "value": 28}, {"name": "Bronze Earrings", "value": 22}, {"name": "Leather Bracelet", "value": 18}, {"name": "Ring Set", "value": 17}]',
      85.00,
      'delivered',
      'USPS9234567890',
      'USPS',
      NOW() - INTERVAL '2 months 25 days',
      NOW() - INTERVAL '2 months 20 days',
      5,
      'Absolutely loved everything! The amber necklace is stunning and the quality is incredible. Worth every penny!',
      NOW() - INTERVAL '2 months 18 days'
    );

    -- December Box (delivered)
    INSERT INTO subscription_boxes (
      subscription_id, plan_id, box_number, month, year,
      theme, theme_description,
      products, total_value, status,
      tracking_number, carrier, shipped_at, delivered_at,
      rating, review_text, reviewed_at
    ) VALUES (
      sub1_id,
      sub1_plan_id,
      2,
      'December',
      2025,
      'Winter Sparkle',
      'Festive pieces perfect for holiday celebrations',
      '[{"name": "Crystal Drop Earrings", "value": 32}, {"name": "Silver Chain Necklace", "value": 24}, {"name": "Statement Ring", "value": 20}, {"name": "Bracelet", "value": 16}]',
      92.00,
      'delivered',
      'USPS9234567891',
      'USPS',
      NOW() - INTERVAL '1 month 25 days',
      NOW() - INTERVAL '1 month 21 days',
      5,
      'Perfect timing for the holidays! Got so many compliments on the crystal earrings.',
      NOW() - INTERVAL '1 month 19 days'
    );

    -- January Box (shipped)
    INSERT INTO subscription_boxes (
      subscription_id, plan_id, box_number, month, year,
      theme, theme_description,
      products, total_value, status,
      tracking_number, carrier, shipped_at
    ) VALUES (
      sub1_id,
      sub1_plan_id,
      3,
      'January',
      2026,
      'New Beginnings',
      'Fresh, minimalist designs to start the year right',
      '[{"name": "Moonstone Pendant", "value": 30}, {"name": "Simple Hoops", "value": 20}, {"name": "Dainty Bracelet", "value": 18}, {"name": "Stackable Rings", "value": 22}]',
      90.00,
      'in_transit',
      'USPS9234567892',
      'USPS',
      NOW() - INTERVAL '3 days'
    );
  END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check what was created
SELECT 'Shopping Agents' as table_name, COUNT(*) as count FROM shopping_agents
UNION ALL
SELECT 'Agent Conversations', COUNT(*) FROM agent_conversations
UNION ALL
SELECT 'Live Events', COUNT(*) FROM live_shopping_events
UNION ALL
SELECT 'Event Messages', COUNT(*) FROM event_chat_messages
UNION ALL
SELECT 'Subscription Plans', COUNT(*) FROM subscription_plans
UNION ALL
SELECT 'User Subscriptions', COUNT(*) FROM user_subscriptions
UNION ALL
SELECT 'Subscription Boxes', COUNT(*) FROM subscription_boxes;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Seed data successfully loaded for AI City v5.1!';
  RAISE NOTICE '   - 3 AI Shopping Agents created';
  RAISE NOTICE '   - 3 Live Shopping Events created';
  RAISE NOTICE '   - 3 Subscription Plans created';
  RAISE NOTICE '   - 2 Active User Subscriptions created';
  RAISE NOTICE '   - 3 Sample Subscription Boxes created';
END $$;
