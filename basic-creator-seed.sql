-- =====================================================
-- BASIC CREATOR STOREFRONTS SEED DATA
-- Creates sample creator storefronts for the AI City seed data
-- =====================================================

-- Insert basic creator storefronts for demo purposes - Only if they don't exist
INSERT INTO creator_storefronts (
  vendor_id, user_id, storefront_name, slug, brand_identity,
  location_hall_id, storefront_tier, ai_assistant_enabled,
  status, featured, verified
)
SELECT
  'demo-creator-1',
  'demo-user-1',
  'Artisan Jewelry Co',
  'artisan-jewelry-co',
  '{
    "logo": "https://images.unsplash.com/photo-1556761175-b413da4baf72",
    "colors": ["#D4AF37", "#8B4513", "#F5F5DC"],
    "fonts": ["serif", "script"],
    "description": "Handcrafted jewelry with soul",
    "story": "Creating beautiful pieces that tell stories"
  }',
  (SELECT id FROM halls LIMIT 1),
  'premium',
  true,
  'active',
  true,
  true
WHERE NOT EXISTS (SELECT 1 FROM creator_storefronts WHERE vendor_id = 'demo-creator-1');

INSERT INTO creator_storefronts (
  vendor_id, user_id, storefront_name, slug, brand_identity,
  location_hall_id, storefront_tier, ai_assistant_enabled,
  status, featured, verified
)
SELECT
  'demo-creator-2',
  'demo-user-2',
  'Wellness Essentials',
  'wellness-essentials',
  '{
    "logo": "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c",
    "colors": ["#98FB98", "#F0E68C", "#DDA0DD"],
    "fonts": ["clean", "modern"],
    "description": "Natural wellness products for modern living",
    "story": "Bringing nature''s healing power to your daily routine"
  }',
  (SELECT id FROM halls LIMIT 1 OFFSET 1),
  'basic',
  true,
  'active',
  false,
  true
WHERE NOT EXISTS (SELECT 1 FROM creator_storefronts WHERE vendor_id = 'demo-creator-2');

INSERT INTO creator_storefronts (
  vendor_id, user_id, storefront_name, slug, brand_identity,
  location_hall_id, storefront_tier, ai_assistant_enabled,
  status, featured, verified
)
SELECT
  'demo-creator-3',
  'demo-user-3',
  'Home & Hearth Decor',
  'home-hearth-decor',
  '{
    "logo": "https://images.unsplash.com/photo-1513885535751-8b9238bd345a",
    "colors": ["#8B4513", "#D2B48C", "#F5DEB3"],
    "fonts": ["warm", "traditional"],
    "description": "Cozy home decor for the modern hearth",
    "story": "Making homes feel like havens"
  }',
  (SELECT id FROM halls LIMIT 1 OFFSET 2),
  'premium',
  true,
  'active',
  true,
  false
WHERE NOT EXISTS (SELECT 1 FROM creator_storefronts WHERE vendor_id = 'demo-creator-3');

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Basic creator storefronts created successfully!';
  RAISE NOTICE '   - 3 Demo creator storefronts added (or skipped if existing)';
  RAISE NOTICE '   - Ready for full seed data import';
END $$;