-- Complete database schema for AI-Native Mall
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Microstores table (already exists, but adding any missing columns)
CREATE TABLE IF NOT EXISTS microstores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table with embedding support
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT NOT NULL,
  tags TEXT[],
  microstore_id UUID REFERENCES microstores(id) ON DELETE CASCADE,
  embedding vector(1536), -- For semantic search
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS products_embedding_idx ON products 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  microstore_id UUID REFERENCES microstores(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  shipping_address JSONB,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop existing triggers and policies on analytics and cart_items before recreating
DROP TRIGGER IF EXISTS update_analytics_updated_at ON analytics;
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;

-- Drop and recreate analytics table with correct TEXT type for user_id
DROP TABLE IF EXISTS analytics CASCADE;
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'add_to_cart', 'purchase', 'search')),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  microstore_id UUID REFERENCES microstores(id) ON DELETE SET NULL,
  user_id TEXT, -- Optional: link to auth.users (TEXT type matches auth.uid())
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX analytics_event_type_idx ON analytics(event_type);
CREATE INDEX analytics_product_id_idx ON analytics(product_id);
CREATE INDEX analytics_microstore_id_idx ON analytics(microstore_id);
CREATE INDEX analytics_created_at_idx ON analytics(created_at DESC);

-- Drop and recreate cart_items table with correct TEXT type for user_id
DROP TABLE IF EXISTS cart_items CASCADE;
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- Link to auth.users (TEXT type matches auth.uid())
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Product SEO metadata table
CREATE TABLE IF NOT EXISTS product_seo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[],
  og_title TEXT,
  og_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social media content table
CREATE TABLE IF NOT EXISTS product_social (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  tiktok_hook TEXT,
  instagram_caption TEXT,
  tweet TEXT,
  hashtags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - adjust policies based on your auth setup
ALTER TABLE microstores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_social ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid type mismatch errors)
DROP POLICY IF EXISTS "Public read access for microstores" ON microstores;
DROP POLICY IF EXISTS "Public read access for products" ON products;
DROP POLICY IF EXISTS "Public write access for analytics" ON analytics;
DROP POLICY IF EXISTS "Users can manage their cart" ON cart_items;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can view their orders" ON orders;
DROP POLICY IF EXISTS "Admin full access to vendors" ON vendors;
DROP POLICY IF EXISTS "Admin full access to orders" ON orders;

-- Public read access policies (adjust as needed)
CREATE POLICY "Public read access for microstores" ON microstores FOR SELECT TO public USING (true);
CREATE POLICY "Public read access for products" ON products FOR SELECT TO public USING (true);
CREATE POLICY "Public write access for analytics" ON analytics FOR INSERT TO public WITH CHECK (true);

-- Allow authenticated users to manage their cart
CREATE POLICY "Users can manage their cart" ON cart_items 
  FOR ALL TO authenticated 
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Allow authenticated users to create orders
CREATE POLICY "Users can create orders" ON orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can view their orders" ON orders FOR SELECT TO authenticated USING (true);

-- Admin policies (you may want to create a specific admin role)
CREATE POLICY "Admin full access to vendors" ON vendors FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access to orders" ON orders FOR ALL TO authenticated USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_microstores_updated_at ON microstores;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
DROP TRIGGER IF EXISTS update_product_seo_updated_at ON product_seo;
DROP TRIGGER IF EXISTS update_product_social_updated_at ON product_social;

-- Create triggers for updated_at
CREATE TRIGGER update_microstores_updated_at BEFORE UPDATE ON microstores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_seo_updated_at BEFORE UPDATE ON product_seo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_social_updated_at BEFORE UPDATE ON product_social
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
