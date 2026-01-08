-- =====================================================
-- 🌟 SAMPLE DISTRICTS SEED DATA
-- Run this in Supabase SQL Editor to populate sample districts
-- =====================================================

-- Insert sample microstores/districts
INSERT INTO microstores (name, slug, description, category, created_at) VALUES
  -- Technology & Innovation
  ('Neural Tech Hub', 'neural-tech-hub', 'Where cutting-edge technology meets AI-curated innovation. Discover the latest gadgets, smart devices, and futuristic tech.', 'electronics', NOW()),
  
  -- Fashion & Style
  ('Ethereal Fashion District', 'ethereal-fashion', 'AI-styled fashion from emerging designers and timeless brands. Your personal AI stylist awaits.', 'fashion', NOW()),
  
  -- Home & Living
  ('Conscious Living Quarters', 'conscious-living', 'Sustainable, smart, and beautiful home goods curated by AI for modern living.', 'home', NOW()),
  
  -- Beauty & Wellness
  ('Radiance Sanctuary', 'radiance-sanctuary', 'AI-personalized beauty and wellness products for your unique self-care journey.', 'beauty', NOW()),
  
  -- Sports & Fitness
  ('Kinetic Performance Zone', 'kinetic-performance', 'High-performance gear and AI-optimized fitness equipment for every athlete.', 'sports', NOW()),
  
  -- Books & Knowledge
  ('Infinite Library', 'infinite-library', 'AI-recommended books, courses, and knowledge treasures curated for curious minds.', 'books', NOW()),
  
  -- Food & Culinary
  ('Artisan Flavor Market', 'artisan-flavor', 'Gourmet foods, specialty ingredients, and culinary experiences guided by AI chefs.', 'food', NOW()),
  
  -- Creative & Hobbies
  ('Makers Haven', 'makers-haven', 'Art supplies, craft materials, and creative tools discovered by AI for makers and artists.', 'creative', NOW()),
  
  -- Entertainment & Gaming
  ('Digital Playground', 'digital-playground', 'Games, entertainment, and immersive experiences curated by AI game masters.', 'entertainment', NOW()),
  
  -- Luxury & Premium
  ('Prestige Pavilion', 'prestige-pavilion', 'Exclusive luxury goods and premium experiences selected by AI connoisseurs.', 'luxury', NOW())
ON CONFLICT (slug) DO NOTHING;

-- Verify insertion
SELECT 
  '✅ Sample districts created!' AS status,
  COUNT(*) AS district_count,
  string_agg(name, ', ') AS district_names
FROM microstores;
