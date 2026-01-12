-- =====================================================
-- AIVERSE 3D ASSET CREATION SYSTEM MIGRATION
-- Adds tables and functions for mythic 3D asset generation
-- Following Additive Design Law: expand, never overwrite
-- =====================================================

-- =====================================================
-- 3D ASSETS TABLE
-- Stores all generated 3D models, scenes, avatars, sigils
-- =====================================================

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('model', 'scene', 'avatar', 'sigil', 'ritual-object', 'district-asset')),
  name TEXT NOT NULL,
  description TEXT,

  -- File storage
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  file_format TEXT, -- .glb, .gltf, .obj, etc.

  -- Generation metadata
  created_by TEXT NOT NULL, -- user_id of creator
  created_from_upload_id UUID, -- reference to uploads table

  -- Mythic properties (following brand essence)
  district_assignment TEXT, -- which district this belongs to
  ritual_assignment TEXT, -- which ritual this serves
  citizen_archetype TEXT, -- which archetype this represents

  -- AI generation metadata
  generation_prompt TEXT,
  generation_model TEXT DEFAULT 'gpt-4', -- AI model used
  generation_timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Tags and categorization
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb, -- extensible metadata

  -- Status and visibility
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_created_by ON assets(created_by);
CREATE INDEX IF NOT EXISTS idx_assets_district ON assets(district_assignment);
CREATE INDEX IF NOT EXISTS idx_assets_ritual ON assets(ritual_assignment);
CREATE INDEX IF NOT EXISTS idx_assets_public ON assets(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_assets_featured ON assets(is_featured) WHERE is_featured = true;

-- =====================================================
-- UPLOADS TABLE
-- Tracks all uploaded files (admin inputs, user selfies)
-- =====================================================

CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,

  -- File information
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL, -- storage path
  file_size_bytes INTEGER,
  mime_type TEXT,

  -- Upload context
  upload_type TEXT NOT NULL CHECK (upload_type IN ('admin_input', 'user_selfie', 'admin_scene')),
  purpose TEXT, -- '3d_generation', 'avatar_creation', etc.

  -- Processing status
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,

  -- Generated assets (can create multiple assets from one upload)
  generated_asset_ids UUID[] DEFAULT ARRAY[]::UUID[],

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Indexes for uploads
CREATE INDEX IF NOT EXISTS idx_uploads_user ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_type ON uploads(upload_type);
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(processing_status);

-- =====================================================
-- USER AVATAR EXTENSION
-- Extend profiles table with 3D avatar support
-- =====================================================

-- Add avatar columns to existing profiles table (expanding, not overwriting)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_model_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_generation_status TEXT DEFAULT 'none' CHECK (avatar_generation_status IN ('none', 'generating', 'ready', 'failed')),
ADD COLUMN IF NOT EXISTS avatar_upload_id UUID REFERENCES uploads(id);

-- =====================================================
-- RLS POLICIES (Additive Security)
-- =====================================================

-- Assets policies
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Public assets can be read by anyone
CREATE POLICY "Public assets are viewable by everyone" ON assets
  FOR SELECT USING (is_public = true);

-- Users can view their own assets
CREATE POLICY "Users can view their own assets" ON assets
  FOR SELECT USING (created_by = auth.uid()::text);

-- Admins can manage all assets
CREATE POLICY "Admins can manage all assets" ON assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND role IN ('admin', 'creator', 'architect')
    )
  );

-- Uploads policies
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Users can view their own uploads
CREATE POLICY "Users can view their own uploads" ON uploads
  FOR SELECT USING (user_id = auth.uid()::text);

-- Users can create their own uploads
CREATE POLICY "Users can create their own uploads" ON uploads
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Admins can manage all uploads
CREATE POLICY "Admins can manage all uploads" ON uploads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND role IN ('admin', 'creator', 'architect')
    )
  );

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to increment asset usage count
CREATE OR REPLACE FUNCTION increment_asset_usage(asset_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE assets
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = asset_id;
END;
$$;

-- Function to link upload to generated asset
CREATE OR REPLACE FUNCTION link_upload_to_asset(upload_id UUID, asset_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE uploads
  SET generated_asset_ids = array_append(generated_asset_ids, asset_id),
      processing_status = 'completed',
      processed_at = NOW()
  WHERE id = upload_id;
END;
$$;

-- Function to update user avatar status
CREATE OR REPLACE FUNCTION update_user_avatar_status(user_id TEXT, status TEXT, avatar_url TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE profiles
  SET avatar_generation_status = status,
      avatar_model_url = COALESCE(avatar_url, avatar_model_url),
      updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- =====================================================
-- STORAGE BUCKET SETUP (if not exists)
-- =====================================================

-- Create storage bucket for uploads if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for uploads bucket (private)
CREATE POLICY "Users can upload their own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own uploads" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for assets bucket (public read)
CREATE POLICY "Public assets are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'assets');

CREATE POLICY "Admins can manage assets" ON storage.objects
  FOR ALL USING (
    bucket_id = 'assets'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND role IN ('admin', 'creator', 'architect')
    )
  );

-- =====================================================
-- SEED DATA (Mythic Assets)
-- =====================================================

-- Insert some initial mythic districts and archetypes
INSERT INTO assets (type, name, description, file_url, created_by, district_assignment, is_public, tags, metadata)
VALUES
  ('district-asset', 'Ember District Sigil', 'The pulsing heart of transformation and rebirth', '/assets/sigils/ember-district-sigil.glb', 'system', 'ember', true, ARRAY['sigil', 'district', 'ember'], '{"mythic_tone": "pulse_ember", "ritual": "forging"}'),
  ('district-asset', 'Lumen District Beacon', 'Guiding light through the fog of uncertainty', '/assets/sigils/lumen-district-beacon.glb', 'system', 'lumen', true, ARRAY['sigil', 'district', 'lumen'], '{"mythic_tone": "lumen_gold", "ritual": "guidance"}'),
  ('ritual-object', 'Arrival Mirror', 'The reflective surface that welcomes new citizens', '/assets/rituals/arrival-mirror.glb', 'system', null, true, ARRAY['ritual', 'arrival', 'mirror'], '{"mythic_tone": "fog_silver", "archetype": "wanderer"}')
ON CONFLICT DO NOTHING;