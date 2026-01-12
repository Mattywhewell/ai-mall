-- Listing Manager - Sales Channel Integrations Schema
-- Supports 40+ e-commerce platforms for multi-channel selling

-- Channel connection settings
CREATE TABLE IF NOT EXISTS seller_channel_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_type VARCHAR(50) NOT NULL, -- 'shopify', 'woocommerce', 'ebay', etc.
  channel_name VARCHAR(100) NOT NULL, -- Display name for the channel
  is_active BOOLEAN DEFAULT true,
  connection_status VARCHAR(20) DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error'

  -- API Credentials (encrypted)
  api_key TEXT, -- Encrypted API key
  api_secret TEXT, -- Encrypted API secret
  access_token TEXT, -- Encrypted access token
  refresh_token TEXT, -- Encrypted refresh token
  store_url VARCHAR(500), -- Store URL for platform
  store_id VARCHAR(100), -- Store ID
  marketplace_id VARCHAR(50), -- For Amazon, eBay, etc.

  -- Sync settings
  auto_sync_orders BOOLEAN DEFAULT true,
  auto_sync_inventory BOOLEAN DEFAULT true,
  auto_sync_prices BOOLEAN DEFAULT false,
  sync_frequency_minutes INTEGER DEFAULT 60, -- How often to sync

  -- Last sync timestamps
  last_order_sync TIMESTAMP WITH TIME ZONE,
  last_inventory_sync TIMESTAMP WITH TIME ZONE,
  last_price_sync TIMESTAMP WITH TIME ZONE,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  -- Error tracking
  last_error_message TEXT,
  last_error_timestamp TIMESTAMP WITH TIME ZONE,
  consecutive_failures INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(seller_id, channel_type, store_id)
);

-- Channel-specific product mappings
CREATE TABLE IF NOT EXISTS channel_product_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_connection_id UUID NOT NULL REFERENCES seller_channel_connections(id) ON DELETE CASCADE,
  local_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Channel-specific identifiers
  channel_product_id VARCHAR(100) NOT NULL, -- Product ID on the channel
  channel_variant_id VARCHAR(100), -- Variant ID if applicable
  channel_sku VARCHAR(100), -- SKU on the channel

  -- Sync settings
  sync_price BOOLEAN DEFAULT true,
  sync_inventory BOOLEAN DEFAULT true,
  price_multiplier DECIMAL(5,2) DEFAULT 1.0, -- Price adjustment multiplier
  price_offset DECIMAL(10,2) DEFAULT 0.0, -- Price adjustment offset

  -- Channel-specific data
  channel_data JSONB, -- Store channel-specific product data

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(channel_connection_id, channel_product_id)
);

-- Order sync tracking
CREATE TABLE IF NOT EXISTS channel_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_connection_id UUID NOT NULL REFERENCES seller_channel_connections(id) ON DELETE CASCADE,

  -- Channel order identifiers
  channel_order_id VARCHAR(100) NOT NULL,
  channel_order_number VARCHAR(100),

  -- Order data
  order_data JSONB NOT NULL, -- Full order data from channel
  order_status VARCHAR(50) DEFAULT 'pending',
  order_total DECIMAL(10,2),
  order_currency VARCHAR(3) DEFAULT 'USD',

  -- Customer info
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),

  -- Sync status
  sync_status VARCHAR(20) DEFAULT 'synced', -- 'synced', 'pending', 'error'
  last_sync_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(channel_connection_id, channel_order_id)
);

-- Inventory sync log
CREATE TABLE IF NOT EXISTS inventory_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_connection_id UUID NOT NULL REFERENCES seller_channel_connections(id) ON DELETE CASCADE,
  product_mapping_id UUID REFERENCES channel_product_mappings(id),

  -- Sync details
  sync_type VARCHAR(20) NOT NULL, -- 'push', 'pull'
  quantity_before INTEGER,
  quantity_after INTEGER,
  sync_status VARCHAR(20) DEFAULT 'success', -- 'success', 'error'
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price sync log
CREATE TABLE IF NOT EXISTS price_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_connection_id UUID NOT NULL REFERENCES seller_channel_connections(id) ON DELETE CASCADE,
  product_mapping_id UUID REFERENCES channel_product_mappings(id),

  -- Sync details
  price_before DECIMAL(10,2),
  price_after DECIMAL(10,2),
  sync_status VARCHAR(20) DEFAULT 'success', -- 'success', 'error'
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supported channel types
CREATE TABLE IF NOT EXISTS supported_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_type VARCHAR(50) UNIQUE NOT NULL,
  channel_name VARCHAR(100) NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  website_url VARCHAR(500),

  -- API capabilities
  supports_orders BOOLEAN DEFAULT true,
  supports_inventory BOOLEAN DEFAULT true,
  supports_prices BOOLEAN DEFAULT true,
  requires_oauth BOOLEAN DEFAULT false,
  api_docs_url VARCHAR(500),

  -- Implementation status
  is_implemented BOOLEAN DEFAULT false,
  implementation_priority INTEGER DEFAULT 999,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert supported channels
INSERT INTO supported_channels (channel_type, channel_name, description, supports_orders, supports_inventory, supports_prices, requires_oauth, is_implemented, implementation_priority) VALUES
  ('shopify', 'Shopify', 'Leading e-commerce platform', true, true, true, true, false, 1),
  ('woocommerce', 'WooCommerce', 'WordPress e-commerce plugin', true, true, true, false, false, 2),
  ('ebay', 'eBay', 'Global marketplace', true, true, true, true, false, 3),
  ('amazon', 'Amazon', 'World''s largest online retailer', true, true, true, true, false, 4),
  ('bigcommerce', 'BigCommerce', 'Enterprise e-commerce platform', true, true, true, true, false, 5),
  ('etsy', 'Etsy', 'Handmade and vintage marketplace', true, true, true, true, false, 6),
  ('tiktok_shop', 'TikTok Shop', 'TikTok''s e-commerce platform', true, true, true, true, false, 7),
  ('wish', 'Wish', 'Mobile-first marketplace', true, true, true, true, false, 8),
  ('onbuy', 'OnBuy', 'UK marketplace', true, true, true, true, false, 9),
  ('ekm', 'EKM', 'UK e-commerce platform', true, true, true, false, false, 10),
  ('wix', 'Wix', 'Website builder with e-commerce', true, true, true, true, false, 11),
  ('3dcart', '3dCart', 'E-commerce platform', true, true, true, false, false, 12),
  ('aliexpress', 'AliExpress', 'Global wholesale marketplace', true, true, true, true, false, 13),
  ('bol_com', 'Bol.com', 'Dutch marketplace', true, true, true, true, false, 14),
  ('coolshop', 'Coolshop', 'Nordic marketplace', true, true, true, true, false, 15),
  ('elala', 'Elala', 'Fashion marketplace', true, true, true, true, false, 16),
  ('facebook_shops', 'Facebook Shops', 'Facebook e-commerce', true, true, true, true, false, 17),
  ('flipkart', 'Flipkart', 'Indian e-commerce giant', true, true, true, true, false, 18),
  ('fyndiq', 'Fyndiq', 'Nordic marketplace', true, true, true, true, false, 19),
  ('groupon', 'Groupon', 'Deal marketplace', true, true, true, true, false, 20),
  ('kartrocket', 'Kartrocket', 'Indian e-commerce platform', true, true, true, false, false, 21),
  ('lazada', 'Lazada', 'Southeast Asian marketplace', true, true, true, true, false, 22),
  ('linio', 'Linio', 'Latin American marketplace', true, true, true, true, false, 23),
  ('magento', 'Magento', 'Enterprise e-commerce platform', true, true, true, false, false, 24),
  ('magento2', 'Magento 2', 'Latest Magento version', true, true, true, false, false, 25),
  ('mercado_libre', 'Mercado Libre', 'Latin American marketplace', true, true, true, true, false, 26),
  ('nopcommerce', 'nopCommerce', 'Open-source e-commerce', true, true, true, false, false, 27),
  ('opencart', 'OpenCart', 'Open-source e-commerce', true, true, true, false, false, 28),
  ('oscommerce', 'osCommerce', 'Legacy e-commerce platform', true, true, true, false, false, 29),
  ('ozon', 'Ozon', 'Russian marketplace', true, true, true, true, false, 30),
  ('prestashop', 'PrestaShop', 'European e-commerce platform', true, true, true, false, false, 31),
  ('privalia', 'Privalia', 'Fashion flash sales', true, true, true, true, false, 32),
  ('reverb', 'Reverb', 'Music gear marketplace', true, true, true, true, false, 33),
  ('shopclues', 'Shopclues', 'Indian marketplace', true, true, true, true, false, 34),
  ('spartoo', 'Spartoo', 'European shoe marketplace', true, true, true, true, false, 35),
  ('tanga', 'Tanga', 'Fashion marketplace', true, true, true, true, false, 36),
  ('trademe', 'Trade Me', 'New Zealand marketplace', true, true, true, true, false, 37),
  ('tophatter', 'Tophatter', 'Flash sales marketplace', true, true, true, true, false, 38),
  ('wayfair', 'Wayfair', 'Home goods marketplace', true, true, true, true, false, 39),
  ('wowcher', 'Wowcher', 'UK deal marketplace', true, true, true, true, false, 40),
  ('x_cart', 'X-Cart', 'E-commerce platform', true, true, true, false, false, 41),
  ('yatego', 'Yatego', 'German marketplace', true, true, true, true, false, 42),
  ('zencart', 'Zen Cart', 'Open-source e-commerce', true, true, true, false, false, 43),
  ('zencommerce', 'Zencommerce', 'E-commerce platform', true, true, true, false, false, 44)
ON CONFLICT (channel_type) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_channel_connections_seller ON seller_channel_connections(seller_id);
CREATE INDEX IF NOT EXISTS idx_channel_connections_type ON seller_channel_connections(channel_type);
CREATE INDEX IF NOT EXISTS idx_channel_connections_active ON seller_channel_connections(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_product_mappings_seller ON channel_product_mappings(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_mappings_channel ON channel_product_mappings(channel_connection_id);
CREATE INDEX IF NOT EXISTS idx_product_mappings_local ON channel_product_mappings(local_product_id);

CREATE INDEX IF NOT EXISTS idx_channel_orders_seller ON channel_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_channel_orders_channel ON channel_orders(channel_connection_id);
CREATE INDEX IF NOT EXISTS idx_channel_orders_status ON channel_orders(order_status);

CREATE INDEX IF NOT EXISTS idx_inventory_sync_seller ON inventory_sync_log(seller_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sync_channel ON inventory_sync_log(channel_connection_id);

CREATE INDEX IF NOT EXISTS idx_price_sync_seller ON price_sync_log(seller_id);
CREATE INDEX IF NOT EXISTS idx_price_sync_channel ON price_sync_log(channel_connection_id);

-- Row Level Security
ALTER TABLE seller_channel_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE supported_channels ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own channel connections" ON seller_channel_connections
  FOR ALL USING (auth.uid()::text = seller_id);

CREATE POLICY "Users can manage their own product mappings" ON channel_product_mappings
  FOR ALL USING (auth.uid()::text = seller_id);

CREATE POLICY "Users can view their own channel orders" ON channel_orders
  FOR ALL USING (auth.uid()::text = seller_id);

CREATE POLICY "Users can view their own inventory sync logs" ON inventory_sync_log
  FOR ALL USING (auth.uid()::text = seller_id);

CREATE POLICY "Users can view their own price sync logs" ON price_sync_log
  FOR ALL USING (auth.uid()::text = seller_id);

CREATE POLICY "Everyone can view supported channels" ON supported_channels
  FOR SELECT USING (true);

-- Functions for encryption/decryption of API credentials
-- Note: In production, use proper encryption with a key management system

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_seller_channel_connections_updated_at
  BEFORE UPDATE ON seller_channel_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channel_product_mappings_updated_at
  BEFORE UPDATE ON channel_product_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channel_orders_updated_at
  BEFORE UPDATE ON channel_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();