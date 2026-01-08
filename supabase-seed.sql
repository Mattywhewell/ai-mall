-- AI-Native Mall Database Schema and Seed Data
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (CASCADE will also drop policies)
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS microstores CASCADE;

-- Create microstores table
CREATE TABLE microstores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  tags TEXT[],
  microstore_id UUID NOT NULL REFERENCES microstores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_products_microstore_id ON products(microstore_id);
CREATE INDEX idx_microstores_slug ON microstores(slug);

-- Seed data for microstores
INSERT INTO microstores (name, slug, description, category) VALUES
('ByteHub', 'bytehub', 'Cutting-edge technology and gadgets for the modern innovator', 'Tech & Gadgets'),
('GlowHaus', 'glowhaus', 'Premium beauty and wellness products for your self-care journey', 'Beauty & Wellness'),
('CraftCore', 'craftcore', 'Handcrafted home decor and lifestyle essentials', 'Home & Lifestyle'),
('FitForge', 'fitforge', 'Performance gear and nutrition for peak fitness', 'Fitness & Performance'),
('PetPavilion', 'petpavilion', 'Everything your furry friends need for a happy life', 'Pets & Companions');

-- Get microstore IDs for products
DO $$
DECLARE
  bytehub_id UUID;
  glowhaus_id UUID;
  craftcore_id UUID;
  fitforge_id UUID;
  petpavilion_id UUID;
BEGIN
  -- Get IDs
  SELECT id INTO bytehub_id FROM microstores WHERE slug = 'bytehub';
  SELECT id INTO glowhaus_id FROM microstores WHERE slug = 'glowhaus';
  SELECT id INTO craftcore_id FROM microstores WHERE slug = 'craftcore';
  SELECT id INTO fitforge_id FROM microstores WHERE slug = 'fitforge';
  SELECT id INTO petpavilion_id FROM microstores WHERE slug = 'petpavilion';

  -- ByteHub Products
  INSERT INTO products (name, description, price, image_url, tags, microstore_id) VALUES
  ('AI SmartWatch Pro', 'Next-gen smartwatch with AI health tracking and 7-day battery life', 299.99, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', ARRAY['wearable', 'AI', 'health'], bytehub_id),
  ('Wireless Charging Pad', 'Fast 15W Qi-certified wireless charger with cooling fan', 49.99, 'https://images.unsplash.com/photo-1591290619762-c37f53e5d3f1?w=800', ARRAY['accessory', 'charging', 'wireless'], bytehub_id),
  ('Noise-Cancelling Earbuds', 'Premium ANC earbuds with spatial audio and 30-hour battery', 179.99, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800', ARRAY['audio', 'wireless', 'ANC'], bytehub_id),
  ('4K Webcam', 'Professional 4K webcam with auto-focus and HDR', 129.99, 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800', ARRAY['video', '4K', 'streaming'], bytehub_id),
  ('Mechanical Keyboard RGB', 'Customizable RGB mechanical keyboard with hot-swappable switches', 149.99, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800', ARRAY['keyboard', 'gaming', 'RGB'], bytehub_id),
  ('Portable SSD 2TB', 'Ultra-fast portable SSD with USB-C 3.2 Gen 2', 199.99, 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800', ARRAY['storage', 'portable', 'SSD'], bytehub_id);

  -- GlowHaus Products
  INSERT INTO products (name, description, price, image_url, tags, microstore_id) VALUES
  ('Vitamin C Serum', 'Brightening serum with 20% vitamin C and hyaluronic acid', 45.00, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800', ARRAY['skincare', 'serum', 'brightening'], glowhaus_id),
  ('Jade Facial Roller', 'Natural jade roller for lymphatic drainage and depuffing', 28.00, 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800', ARRAY['beauty tool', 'massage', 'jade'], glowhaus_id),
  ('Aromatherapy Diffuser', 'Ultrasonic essential oil diffuser with LED mood lighting', 39.99, 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800', ARRAY['aromatherapy', 'wellness', 'diffuser'], glowhaus_id),
  ('Collagen Face Mask Set', 'Hydrating sheet masks with marine collagen (pack of 10)', 32.00, 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800', ARRAY['mask', 'hydrating', 'collagen'], glowhaus_id),
  ('Organic Body Butter', 'Nourishing shea butter blend with lavender and vanilla', 24.99, 'https://images.unsplash.com/photo-1556228994-e9bbf5c4be4f?w=800', ARRAY['body care', 'organic', 'moisturizer'], glowhaus_id);

  -- CraftCore Products
  INSERT INTO products (name, description, price, image_url, tags, microstore_id) VALUES
  ('Handwoven Macrame Wall Hanging', 'Bohemian macrame art piece, handmade with cotton rope', 68.00, 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800', ARRAY['wall decor', 'handmade', 'bohemian'], craftcore_id),
  ('Ceramic Planter Set', 'Set of 3 minimalist ceramic planters with drainage holes', 54.99, 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800', ARRAY['planter', 'ceramic', 'set'], craftcore_id),
  ('Scented Soy Candle Collection', 'Hand-poured soy candles in amber jars (set of 4)', 42.00, 'https://images.unsplash.com/photo-1602874801006-96e3dc4c8120?w=800', ARRAY['candle', 'soy', 'aromatherapy'], craftcore_id),
  ('Bamboo Kitchen Utensil Set', 'Eco-friendly 6-piece bamboo cooking utensil set', 29.99, 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800', ARRAY['kitchen', 'bamboo', 'eco-friendly'], craftcore_id),
  ('Woven Storage Baskets', 'Natural seagrass baskets with handles (set of 3)', 49.99, 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800', ARRAY['storage', 'basket', 'natural'], craftcore_id),
  ('Minimalist Wall Clock', 'Scandinavian-style wall clock with silent movement', 38.00, 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800', ARRAY['clock', 'minimalist', 'wall decor'], craftcore_id);

  -- FitForge Products
  INSERT INTO products (name, description, price, image_url, tags, microstore_id) VALUES
  ('Adjustable Dumbbells 50lb', 'Space-saving adjustable dumbbells with quick-change system', 249.99, 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800', ARRAY['weights', 'dumbbells', 'home gym'], fitforge_id),
  ('Yoga Mat Premium', 'Extra-thick non-slip yoga mat with carrying strap', 59.99, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800', ARRAY['yoga', 'mat', 'fitness'], fitforge_id),
  ('Protein Powder Whey', 'Premium whey isolate protein, 25g per serving (2lb)', 49.99, 'https://images.unsplash.com/photo-1579722822598-33f0c4e26c9a?w=800', ARRAY['protein', 'supplement', 'whey'], fitforge_id),
  ('Resistance Bands Set', 'Heavy-duty resistance bands with handles and door anchor', 34.99, 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800', ARRAY['bands', 'resistance', 'portable'], fitforge_id),
  ('Foam Roller', 'High-density foam roller for muscle recovery and massage', 29.99, 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800', ARRAY['recovery', 'massage', 'foam roller'], fitforge_id),
  ('Athletic Performance Socks', 'Compression running socks with arch support (3-pack)', 24.99, 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800', ARRAY['socks', 'running', 'compression'], fitforge_id);

  -- PetPavilion Products
  INSERT INTO products (name, description, price, image_url, tags, microstore_id) VALUES
  ('Automatic Pet Feeder', 'Smart feeder with portion control and timer for dogs and cats', 89.99, 'https://images.unsplash.com/photo-1591769225440-811ad7d6eab3?w=800', ARRAY['feeder', 'automatic', 'smart'], petpavilion_id),
  ('Orthopedic Pet Bed', 'Memory foam pet bed with washable cover (large)', 69.99, 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800', ARRAY['bed', 'orthopedic', 'comfort'], petpavilion_id),
  ('Interactive Cat Toy Tower', 'Multi-level cat toy with spinning balls and scratching pad', 34.99, 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800', ARRAY['toy', 'cat', 'interactive'], petpavilion_id),
  ('Dog Training Treats', 'Natural grain-free training treats with real chicken (16oz)', 18.99, 'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=800', ARRAY['treats', 'training', 'natural'], petpavilion_id),
  ('Pet Grooming Kit', 'Complete grooming kit with clippers, brushes, and nail trimmer', 54.99, 'https://images.unsplash.com/photo-1564208712304-010b1d3b364f?w=800', ARRAY['grooming', 'kit', 'tools'], petpavilion_id);

END $$;

-- Create RLS (Row Level Security) policies if needed
ALTER TABLE microstores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on microstores" ON microstores FOR SELECT USING (true);
CREATE POLICY "Allow public read access on products" ON products FOR SELECT USING (true);

-- Note: For write access, you'll need to create appropriate policies based on your auth requirements
