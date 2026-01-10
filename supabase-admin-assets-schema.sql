-- Admin Assets Table for 3D Model Generation
-- This table stores generated 3D models, scenes, and other admin-created assets

CREATE TABLE IF NOT EXISTS admin_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  asset_type VARCHAR(50) NOT NULL, -- 'generated_3d_model', 'scene', 'texture', etc.
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_format VARCHAR(10) NOT NULL, -- 'glb', 'obj', 'json', 'png', etc.
  file_size_bytes BIGINT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE admin_assets ENABLE ROW LEVEL SECURITY;

-- Allow admins to do everything
CREATE POLICY "Admins can manage admin_assets" ON admin_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Allow read access for authenticated users (for public assets)
CREATE POLICY "Authenticated users can read admin_assets" ON admin_assets
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_assets_type ON admin_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_admin_assets_created_at ON admin_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_assets_tags ON admin_assets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_admin_assets_created_by ON admin_assets(created_by);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_admin_assets_updated_at
  BEFORE UPDATE ON admin_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_assets_updated_at();