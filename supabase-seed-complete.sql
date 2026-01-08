-- ============================================================================
-- AI CITY - COMPLETE SEED DATA
-- Demo data for all systems
-- ============================================================================
-- RUN ORDER: Run AFTER supabase-complete-migration.sql and supabase-rls-policies.sql
-- ============================================================================

-- =====================================================
-- 1. CORE COMMERCE DATA
-- =====================================================

-- Sample Microstores (Districts)
INSERT INTO microstores (name, slug, description, category) VALUES
('Tech Haven', 'tech-haven', 'Cutting-edge gadgets and electronics', 'technology'),
('Artisan Crafts', 'artisan-crafts', 'Handmade items from local artisans', 'crafts'),
('Wellness Corner', 'wellness-corner', 'Natural health and beauty products', 'wellness'),
('Fashion Forward', 'fashion-forward', 'Trendy clothing and accessories', 'fashion'),
('Home Harmony', 'home-harmony', 'Decor and furnishings for your space', 'home')
ON CONFLICT (slug) DO NOTHING;

-- Sample Products
WITH districts AS (
  SELECT id, slug FROM microstores
),
product_data AS (
  SELECT * FROM (VALUES
    -- Tech Haven products
    ('Wireless Earbuds Pro', 'Premium sound quality with active noise cancellation', 89.99, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df', 'tech-haven', ARRAY['audio', 'wireless', 'technology']),
    ('Smart Watch Ultra', 'Track your fitness and stay connected', 299.99, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30', 'tech-haven', ARRAY['wearable', 'fitness', 'smart']),
    
    -- Artisan Crafts products
    ('Handwoven Basket', 'Beautiful natural fiber basket, handmade', 45.00, 'https://images.unsplash.com/photo-1524593689594-aae2f26b75ab', 'artisan-crafts', ARRAY['home', 'handmade', 'storage']),
    ('Ceramic Mug Set', 'Set of 4 unique hand-painted mugs', 52.00, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d', 'artisan-crafts', ARRAY['kitchen', 'handmade', 'ceramic']),
    
    -- Wellness Corner products
    ('Lavender Essential Oil', 'Pure therapeutic grade lavender oil', 24.99, 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108', 'wellness-corner', ARRAY['aromatherapy', 'natural', 'wellness']),
    ('Organic Face Serum', 'Anti-aging serum with natural ingredients', 38.50, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be', 'wellness-corner', ARRAY['skincare', 'organic', 'beauty']),
    
    -- Fashion Forward products
    ('Silk Scarf Collection', 'Luxurious hand-dyed silk scarves', 68.00, 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26', 'fashion-forward', ARRAY['accessories', 'silk', 'fashion']),
    ('Leather Crossbody Bag', 'Genuine leather minimalist bag', 125.00, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa', 'fashion-forward', ARRAY['bags', 'leather', 'accessories']),
    
    -- Home Harmony products
    ('Minimalist Table Lamp', 'Modern design with warm LED lighting', 79.99, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c', 'home-harmony', ARRAY['lighting', 'home', 'modern']),
    ('Throw Pillow Set', 'Set of 3 textured throw pillows', 59.00, 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2', 'home-harmony', ARRAY['home', 'decor', 'textile'])
  ) AS v(name, description, price, image_url, district_slug, tags)
)
INSERT INTO products (name, description, price, image_url, microstore_id, tags)
SELECT p.name, p.description, p.price, p.image_url, d.id, p.tags
FROM product_data p
JOIN districts d ON d.slug = p.district_slug
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. WORLD ARCHITECTURE DATA
-- =====================================================

-- Sample Halls
INSERT INTO halls (name, slug, theme, atmosphere, connected_streets) VALUES
('Innovation Hall', 'innovation-hall', 'innovation', 
 '{"color_primary": "#3B82F6", "color_secondary": "#60A5FA", "brightness": "bright", "energy": "electric"}',
 ARRAY['neon-boulevard', 'tech-corridor']),
 
('Wellness Garden', 'wellness-garden', 'wellness',
 '{"color_primary": "#10B981", "color_secondary": "#34D399", "brightness": "calm", "energy": "peaceful"}',
 ARRAY['wellness-way', 'artisan-row']),
 
('Craft Sanctuary', 'craft-sanctuary', 'craft',
 '{"color_primary": "#F59E0B", "color_secondary": "#FBBF24", "brightness": "warm", "energy": "creative"}',
 ARRAY['artisan-row', 'vintage-lane']),
 
('Motion Plaza', 'motion-plaza', 'motion',
 '{"color_primary": "#EF4444", "color_secondary": "#F87171", "brightness": "dynamic", "energy": "intense"}',
 ARRAY['tech-corridor', 'neon-boulevard']),
 
('Light Pavilion', 'light-pavilion', 'light',
 '{"color_primary": "#FBBF24", "color_secondary": "#FCD34D", "brightness": "radiant", "energy": "uplifting"}',
 ARRAY['wellness-way', 'vintage-lane'])
ON CONFLICT (slug) DO NOTHING;

-- Sample Streets
WITH halls_data AS (SELECT id, slug FROM halls)
INSERT INTO streets (name, slug, personality, connects_hall_id, popularity_score, trending, atmosphere_tags) VALUES
('Neon Boulevard', 'neon-boulevard', 'neon', 
 (SELECT id FROM halls_data WHERE slug = 'innovation-hall'), 85.5, true,
 ARRAY['vibrant', 'modern', 'electric', 'urban']),
 
('Artisan Row', 'artisan-row', 'artisan',
 (SELECT id FROM halls_data WHERE slug = 'craft-sanctuary'), 72.3, false,
 ARRAY['handcrafted', 'authentic', 'warm', 'creative']),
 
('Wellness Way', 'wellness-way', 'wellness',
 (SELECT id FROM halls_data WHERE slug = 'wellness-garden'), 68.7, false,
 ARRAY['calm', 'natural', 'healing', 'serene']),
 
('Tech Corridor', 'tech-corridor', 'tech',
 (SELECT id FROM halls_data WHERE slug = 'innovation-hall'), 91.2, true,
 ARRAY['futuristic', 'sleek', 'innovative', 'digital']),
 
('Vintage Lane', 'vintage-lane', 'vintage',
 (SELECT id FROM halls_data WHERE slug = 'light-pavilion'), 64.8, false,
 ARRAY['nostalgic', 'classic', 'timeless', 'refined'])
ON CONFLICT (slug) DO NOTHING;

-- Sample Chapels
WITH halls_data AS (SELECT id, slug FROM halls)
INSERT INTO chapels (name, slug, emotion, micro_story, ritual, ai_insight, symbolism, connected_to_hall) VALUES
('Chapel of Contemplation', 'contemplation', 'contemplation',
 'A quiet space where thoughts crystallize into clarity. Soft shadows dance on ancient stone.',
 'Light a virtual candle and share your intention for the day.',
 'In stillness, we find movement. In silence, we hear truth.',
 ARRAY['candle', 'shadow', 'stone', 'reflection'],
 (SELECT id FROM halls_data WHERE slug = 'wellness-garden')),
 
('Chapel of Joy', 'joy', 'joy',
 'Sunbeams pour through crystal windows, painting everything in golden light and laughter.',
 'Share something that brought you joy today.',
 'Joy is not the absence of sorrow, but the presence of wonder.',
 ARRAY['light', 'crystal', 'gold', 'laughter'],
 (SELECT id FROM halls_data WHERE slug = 'light-pavilion')),
 
('Chapel of Mystery', 'mystery', 'mystery',
 'Veils of smoke drift between pillars. Questions echo louder than answers ever could.',
 'Ask a question without expecting an answer.',
 'The greatest mysteries are not solved, but experienced.',
 ARRAY['smoke', 'veil', 'pillar', 'echo'],
 (SELECT id FROM halls_data WHERE slug = 'craft-sanctuary')),
 
('Chapel of Serenity', 'serenity', 'serenity',
 'Water flows over smooth stones. Time moves differently here, slow and intentional.',
 'Take three deep breaths and notice what changes.',
 'Serenity is not freedom from the storm, but peace within it.',
 ARRAY['water', 'stone', 'flow', 'peace'],
 (SELECT id FROM halls_data WHERE slug = 'wellness-garden')),
 
('Chapel of Wonder', 'wonder', 'wonder',
 'Constellations swirl overhead. Every surface holds universes waiting to be discovered.',
 'Notice something you''ve never noticed before.',
 'Wonder is the beginning of wisdom and the end of knowing.',
 ARRAY['stars', 'constellation', 'discovery', 'universe'],
 (SELECT id FROM halls_data WHERE slug = 'innovation-hall'))
ON CONFLICT (slug) DO NOTHING;

-- Sample AI Spirits
WITH halls_data AS (SELECT id FROM halls LIMIT 5),
     streets_data AS (SELECT id FROM streets LIMIT 5),
     chapels_data AS (SELECT id FROM chapels LIMIT 5)
INSERT INTO ai_spirits (entity_type, entity_id, spirit_data) 
SELECT * FROM (VALUES
  ('hall', (SELECT id FROM halls_data LIMIT 1), 
   '{"name": "Nexus", "personality": "visionary", "greeting": "Welcome to the intersection of possibilities.", "archetype": "sage"}'::jsonb),
  ('street', (SELECT id FROM streets_data LIMIT 1),
   '{"name": "Pulse", "personality": "energetic", "greeting": "Feel the rhythm of innovation.", "archetype": "catalyst"}'::jsonb),
  ('chapel', (SELECT id FROM chapels_data LIMIT 1),
   '{"name": "Whisper", "personality": "contemplative", "greeting": "In silence, truth speaks.", "archetype": "mystic"}'::jsonb)
) AS v(entity_type, entity_id, spirit_data)
ON CONFLICT (entity_type, entity_id) DO NOTHING;

-- =====================================================
-- 3. V5.1 ENGAGEMENT LAYER DATA
-- =====================================================

-- Sample Users
INSERT INTO users (id, email, full_name, avatar_url) VALUES
(gen_random_uuid(), 'alice@example.com', 'Alice Chen', 'https://i.pravatar.cc/150?img=1'),
(gen_random_uuid(), 'bob@example.com', 'Bob Martinez', 'https://i.pravatar.cc/150?img=2'),
(gen_random_uuid(), 'carol@example.com', 'Carol Johnson', 'https://i.pravatar.cc/150?img=3')
ON CONFLICT (email) DO NOTHING;

-- Sample Shopping Agents
WITH users_data AS (SELECT id FROM users LIMIT 3)
INSERT INTO shopping_agents (user_id, agent_name, personality, style_preferences, budget_range, favorite_categories, color_preferences, total_interactions, recommendation_accuracy, active) 
SELECT * FROM (VALUES
  ((SELECT id::text FROM users_data OFFSET 0 LIMIT 1), 'Ava', 'helpful', 
   '{"style": "modern", "occasion": "casual"}'::jsonb, 
   '{"min": 20, "max": 100}'::jsonb, 
   ARRAY['fashion', 'jewelry', 'beauty'], 
   ARRAY['blue', 'purple', 'gold'],
   25, 0.85, true),
   
  ((SELECT id::text FROM users_data OFFSET 1 LIMIT 1), 'Leo', 'enthusiastic', 
   '{"style": "minimalist", "occasion": "professional"}'::jsonb, 
   '{"min": 50, "max": 300}'::jsonb, 
   ARRAY['tech', 'home', 'art'], 
   ARRAY['black', 'white', 'silver'],
   42, 0.78, true),
   
  ((SELECT id::text FROM users_data OFFSET 2 LIMIT 1), 'Maya', 'friendly', 
   '{"style": "bohemian", "occasion": "gifts"}'::jsonb, 
   '{"min": 10, "max": 75}'::jsonb, 
   ARRAY['craft', 'wellness', 'art'], 
   ARRAY['earth-tones', 'pastels', 'green'],
   18, 0.92, true)
) AS v(user_id, agent_name, personality, style_preferences, budget_range, favorite_categories, color_preferences, total_interactions, recommendation_accuracy, active)
ON CONFLICT DO NOTHING;

-- Sample Live Shopping Events (using placeholder creator IDs)
INSERT INTO live_shopping_events (
  creator_id, title, description, cover_image,
  scheduled_start, scheduled_end, status,
  event_discount_percent, viewers_peak, viewers_total
) VALUES
(gen_random_uuid(), 
 'New Collection Launch - Live Demo',
 'Join me as I showcase my latest handcrafted jewelry collection! Exclusive 20% discount for live viewers.',
 'https://images.unsplash.com/photo-1556761175-b413da4baf72',
 NOW() + INTERVAL '2 days',
 NOW() + INTERVAL '2 days 1 hour',
 'scheduled',
 20, 0, 0),

(gen_random_uuid(),
 'Behind the Scenes: Artisan Workshop Tour',
 'See how I create my products from start to finish. Ask me anything!',
 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b',
 NOW() - INTERVAL '2 hours',
 NOW() + INTERVAL '1 hour',
 'live',
 15, 127, 543),

(gen_random_uuid(),
 'Holiday Gift Ideas - Interactive Shopping',
 'Perfect gifts for everyone on your list! Plus surprise giveaways throughout the stream.',
 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a',
 NOW() - INTERVAL '3 days',
 NOW() - INTERVAL '3 days 1 hour',
 'ended',
 25, 284, 1247)
ON CONFLICT DO NOTHING;

-- Sample Subscription Plans
INSERT INTO subscription_plans (
  creator_id, name, description, tagline, image_url,
  price_monthly, price_quarterly, price_annual,
  products_per_box, estimated_value,
  shipping_included, exclusive_products, early_access,
  allow_preferences, skip_allowed, cancel_anytime,
  active, subscribers_count, retention_rate
) VALUES
(gen_random_uuid(),
 'Artisan Jewelry Box',
 'Receive 3-4 handcrafted jewelry pieces every month, curated just for you. Each box includes exclusive designs you won''t find anywhere else.',
 'Wear unique, feel amazing ✨',
 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908',
 39.99, 108.00, 420.00,
 4, 85.00,
 true, true, true,
 true, true, true,
 true, 127, 0.82),

(gen_random_uuid(),
 'Wellness Ritual Box',
 'Monthly self-care essentials including aromatherapy, natural skincare, and mindfulness tools.',
 'Your monthly moment of zen 🧘‍♀️',
 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c',
 49.99, 135.00, 540.00,
 5, 110.00,
 true, false, false,
 true, true, true,
 true, 89, 0.76),

(gen_random_uuid(),
 'Home Decor Surprise',
 'Transform your space with curated home decor, candles, and lifestyle items. Each month brings a new aesthetic!',
 'Beautiful spaces, happy places 🏡',
 'https://images.unsplash.com/photo-1513694203232-719a280e022f',
 44.99, 120.00, 480.00,
 3, 95.00,
 true, true, true,
 true, true, true,
 true, 203, 0.88)
ON CONFLICT DO NOTHING;

-- Sample User Subscriptions
WITH users_data AS (SELECT id FROM users LIMIT 2),
     plans_data AS (SELECT id FROM subscription_plans LIMIT 2)
INSERT INTO user_subscriptions (
  plan_id, user_id, billing_cycle, price_paid, status,
  start_date, next_billing_date,
  shipping_address, user_preferences,
  boxes_received, lifetime_value
) VALUES
((SELECT id FROM plans_data OFFSET 0 LIMIT 1),
 (SELECT id::text FROM users_data OFFSET 0 LIMIT 1),
 'monthly', 39.99, 'active',
 CURRENT_DATE - INTERVAL '3 months',
 CURRENT_DATE + INTERVAL '1 month',
 '{"street": "123 Main St", "city": "San Francisco", "state": "CA", "zip": "94102", "country": "US"}'::jsonb,
 '{"metal_preference": "gold", "style": "bohemian"}'::jsonb,
 3, 119.97),

((SELECT id FROM plans_data OFFSET 1 LIMIT 1),
 (SELECT id::text FROM users_data OFFSET 1 LIMIT 1),
 'quarterly', 135.00, 'active',
 CURRENT_DATE - INTERVAL '6 months',
 CURRENT_DATE + INTERVAL '2 months',
 '{"street": "456 Oak Ave", "city": "Portland", "state": "OR", "zip": "97201", "country": "US"}'::jsonb,
 '{"scent_preference": "lavender", "skin_type": "sensitive"}'::jsonb,
 2, 270.00)
ON CONFLICT DO NOTHING;

-- Sample Subscription Boxes
WITH subs_data AS (SELECT id, plan_id FROM user_subscriptions LIMIT 1)
INSERT INTO subscription_boxes (
  subscription_id, plan_id, box_number, month, year,
  theme, theme_description,
  products, total_value, status,
  tracking_number, carrier, shipped_at, delivered_at,
  rating, review_text, reviewed_at
) VALUES
((SELECT id FROM subs_data),
 (SELECT plan_id FROM subs_data),
 1, 'November', 2025,
 'Autumn Glow', 'Warm, earthy tones inspired by fall foliage',
 '[{"name": "Amber Necklace", "value": 28}, {"name": "Bronze Earrings", "value": 22}]'::jsonb,
 85.00, 'delivered',
 'USPS9234567890', 'USPS',
 NOW() - INTERVAL '2 months 25 days',
 NOW() - INTERVAL '2 months 20 days',
 5, 'Absolutely loved everything! The amber necklace is stunning and the quality is incredible.',
 NOW() - INTERVAL '2 months 18 days'),

((SELECT id FROM subs_data),
 (SELECT plan_id FROM subs_data),
 2, 'December', 2025,
 'Winter Sparkle', 'Festive pieces perfect for holiday celebrations',
 '[{"name": "Crystal Drop Earrings", "value": 32}, {"name": "Silver Chain Necklace", "value": 24}]'::jsonb,
 92.00, 'delivered',
 'USPS9234567891', 'USPS',
 NOW() - INTERVAL '1 month 25 days',
 NOW() - INTERVAL '1 month 21 days',
 5, 'Perfect timing for the holidays! Got so many compliments on the crystal earrings.',
 NOW() - INTERVAL '1 month 19 days')
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION & COMPLETION
-- =====================================================

-- Count all seeded data
DO $$
DECLARE
  microstore_count INTEGER;
  product_count INTEGER;
  hall_count INTEGER;
  street_count INTEGER;
  chapel_count INTEGER;
  spirit_count INTEGER;
  user_count INTEGER;
  agent_count INTEGER;
  event_count INTEGER;
  plan_count INTEGER;
  subscription_count INTEGER;
  box_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO microstore_count FROM microstores;
  SELECT COUNT(*) INTO product_count FROM products;
  SELECT COUNT(*) INTO hall_count FROM halls;
  SELECT COUNT(*) INTO street_count FROM streets;
  SELECT COUNT(*) INTO chapel_count FROM chapels;
  SELECT COUNT(*) INTO spirit_count FROM ai_spirits;
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO agent_count FROM shopping_agents;
  SELECT COUNT(*) INTO event_count FROM live_shopping_events;
  SELECT COUNT(*) INTO plan_count FROM subscription_plans;
  SELECT COUNT(*) INTO subscription_count FROM user_subscriptions;
  SELECT COUNT(*) INTO box_count FROM subscription_boxes;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SEED DATA LOADED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Core Commerce:';
  RAISE NOTICE '  • Microstores: %', microstore_count;
  RAISE NOTICE '  • Products: %', product_count;
  RAISE NOTICE '';
  RAISE NOTICE 'World Architecture:';
  RAISE NOTICE '  • Halls: %', hall_count;
  RAISE NOTICE '  • Streets: %', street_count;
  RAISE NOTICE '  • Chapels: %', chapel_count;
  RAISE NOTICE '  • AI Spirits: %', spirit_count;
  RAISE NOTICE '';
  RAISE NOTICE 'v5.1 Engagement:';
  RAISE NOTICE '  • Users: %', user_count;
  RAISE NOTICE '  • Shopping Agents: %', agent_count;
  RAISE NOTICE '  • Live Events: %', event_count;
  RAISE NOTICE '  • Subscription Plans: %', plan_count;
  RAISE NOTICE '  • User Subscriptions: %', subscription_count;
  RAISE NOTICE '  • Subscription Boxes: %', box_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Your AI City is ready to explore! 🌆';
  RAISE NOTICE '========================================';
END $$;
