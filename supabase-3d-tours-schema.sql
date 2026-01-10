-- ============================================================================
-- 3D Tours Schema for Suppliers
-- ============================================================================
-- Adds Matterport-style 3D tour functionality to suppliers
-- ============================================================================

-- Add 3D tour fields to suppliers table
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS matterport_url TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tour_title TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tour_description TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tour_enabled BOOLEAN DEFAULT false;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tour_metadata JSONB DEFAULT '{}';

-- Create supplier_3d_tours table for multiple tours per supplier
CREATE TABLE IF NOT EXISTS supplier_3d_tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  matterport_url TEXT NOT NULL, -- Matterport embed URL or tour ID
  tour_type TEXT DEFAULT 'matterport' CHECK (tour_type IN ('matterport', '360', 'custom')),

  enabled BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,

  -- AI-generated metadata
  ai_tags JSONB DEFAULT '[]', -- Auto-detected product hotspots
  ai_descriptions JSONB DEFAULT '{}', -- AI-generated descriptions for areas
  ai_navigation JSONB DEFAULT '{}', -- AI navigation paths and suggestions

  -- Technical metadata
  capture_method TEXT, -- 'pro_camera', 'smartphone', 'drone', etc.
  capture_device TEXT, -- 'matterport_pro', 'iphone_liDAR', 'android_depth', etc.
  scan_date TIMESTAMP WITH TIME ZONE,

  -- SEO and display
  seo_title TEXT,
  seo_description TEXT,
  thumbnail_url TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supplier_tour_hotspots table for interactive hotspots
CREATE TABLE IF NOT EXISTS supplier_tour_hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES supplier_3d_tours(id) ON DELETE CASCADE,

  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  hotspot_type TEXT DEFAULT 'product' CHECK (hotspot_type IN ('product', 'info', 'video', 'link')),

  -- Matterport coordinates
  position_x DECIMAL(10,6),
  position_y DECIMAL(10,6),
  position_z DECIMAL(10,6),

  -- Display properties
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT, -- For videos or images
  link_url TEXT, -- For external links

  -- AI metadata
  ai_generated BOOLEAN DEFAULT false,
  confidence_score DECIMAL(3,2), -- AI confidence 0.0-1.0

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_supplier_tours_supplier ON supplier_3d_tours(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_tours_enabled ON supplier_3d_tours(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_tour_hotspots_tour ON supplier_tour_hotspots(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_hotspots_product ON supplier_tour_hotspots(product_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_tour_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tour_updated_at
  BEFORE UPDATE ON supplier_3d_tours
  FOR EACH ROW
  EXECUTE FUNCTION update_tour_timestamp();

CREATE TRIGGER trigger_hotspot_updated_at
  BEFORE UPDATE ON supplier_tour_hotspots
  FOR EACH ROW
  EXECUTE FUNCTION update_hotspot_timestamp();

-- Function to auto-sync product hotspots
CREATE OR REPLACE FUNCTION sync_tour_product_hotspots(tour_uuid UUID)
RETURNS VOID AS $$
DECLARE
  supplier_uuid UUID;
  product_record RECORD;
BEGIN
  -- Get supplier ID from tour
  SELECT supplier_id INTO supplier_uuid
  FROM supplier_3d_tours
  WHERE id = tour_uuid;

  -- Insert hotspots for all active products of this supplier
  -- This would be called after AI analysis of the 3D tour
  INSERT INTO supplier_tour_hotspots (
    tour_id,
    product_id,
    hotspot_type,
    title,
    description,
    ai_generated,
    confidence_score
  )
  SELECT
    tour_uuid,
    p.id,
    'product',
    p.name,
    p.description,
    true,
    0.85 -- Default confidence for auto-generated
  FROM products p
  WHERE p.supplier_id = supplier_uuid
    AND p.active = true
    AND NOT EXISTS (
      SELECT 1 FROM supplier_tour_hotspots h
      WHERE h.tour_id = tour_uuid AND h.product_id = p.id
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get tour with hotspots
CREATE OR REPLACE FUNCTION get_tour_with_hotspots(tour_uuid UUID)
RETURNS TABLE (
  tour_data JSONB,
  hotspots JSONB[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    jsonb_build_object(
      'id', t.id,
      'title', t.title,
      'description', t.description,
      'matterport_url', t.matterport_url,
      'tour_type', t.tour_type,
      'enabled', t.enabled,
      'featured', t.featured,
      'ai_tags', t.ai_tags,
      'capture_method', t.capture_method,
      'seo_title', t.seo_title,
      'seo_description', t.seo_description,
      'thumbnail_url', t.thumbnail_url,
      'created_at', t.created_at
    ),
    array_agg(
      jsonb_build_object(
        'id', h.id,
        'product_id', h.product_id,
        'hotspot_type', h.hotspot_type,
        'position_x', h.position_x,
        'position_y', h.position_y,
        'position_z', h.position_z,
        'title', h.title,
        'description', h.description,
        'media_url', h.media_url,
        'link_url', h.link_url,
        'ai_generated', h.ai_generated,
        'confidence_score', h.confidence_score
      )
    ) FILTER (WHERE h.id IS NOT NULL)
  FROM supplier_3d_tours t
  LEFT JOIN supplier_tour_hotspots h ON t.id = h.tour_id
  WHERE t.id = tour_uuid
  GROUP BY t.id, t.title, t.description, t.matterport_url, t.tour_type,
           t.enabled, t.featured, t.ai_tags, t.capture_method,
           t.seo_title, t.seo_description, t.thumbnail_url, t.created_at;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE supplier_3d_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_tour_hotspots ENABLE ROW LEVEL SECURITY;

-- Suppliers can manage their own tours
CREATE POLICY "Suppliers can view own tours" ON supplier_3d_tours
  FOR SELECT USING (supplier_id IN (
    SELECT id FROM suppliers WHERE email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Suppliers can manage own tours" ON supplier_3d_tours
  FOR ALL USING (supplier_id IN (
    SELECT id FROM suppliers WHERE email = auth.jwt() ->> 'email'
  ));

-- Hotspots follow tour permissions
CREATE POLICY "Suppliers can view own tour hotspots" ON supplier_tour_hotspots
  FOR SELECT USING (tour_id IN (
    SELECT id FROM supplier_3d_tours WHERE supplier_id IN (
      SELECT id FROM suppliers WHERE email = auth.jwt() ->> 'email'
    )
  ));

CREATE POLICY "Suppliers can manage own tour hotspots" ON supplier_tour_hotspots
  FOR ALL USING (tour_id IN (
    SELECT id FROM supplier_3d_tours WHERE supplier_id IN (
      SELECT id FROM suppliers WHERE email = auth.jwt() ->> 'email'
    )
  ));

-- Comments
COMMENT ON TABLE supplier_3d_tours IS '3D tours for suppliers (Matterport, 360°, etc.)';
COMMENT ON TABLE supplier_tour_hotspots IS 'Interactive hotspots within 3D tours';
COMMENT ON COLUMN supplier_3d_tours.matterport_url IS 'Matterport embed URL or tour identifier';
COMMENT ON COLUMN supplier_3d_tours.ai_tags IS 'AI-detected product locations and features';
COMMENT ON COLUMN supplier_tour_hotspots.position_x IS 'X coordinate in 3D space (Matterport coordinate system)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================