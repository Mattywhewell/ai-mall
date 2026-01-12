-- ===========================================
-- 3D GENERATION SYSTEM DATABASE SCHEMA
-- Migration: 20260111_3d_generation_system
-- ===========================================

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

-- Add RLS policies for admin_assets
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

-- ===========================================
-- User Avatars Table for 3D Avatar Generation
-- ===========================================

CREATE TABLE IF NOT EXISTS user_avatars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  selfie_url TEXT NOT NULL,
  avatar_model_url TEXT,
  status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  generation_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add avatar_model_url to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles'
                 AND column_name = 'avatar_model_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_model_url TEXT;
  END IF;
END $$;

-- Add RLS policies for user_avatars
ALTER TABLE user_avatars ENABLE ROW LEVEL SECURITY;

-- Users can only see their own avatars
CREATE POLICY "Users can view own avatars" ON user_avatars
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can create their own avatars
CREATE POLICY "Users can create own avatars" ON user_avatars
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own avatars
CREATE POLICY "Users can update own avatars" ON user_avatars
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Admins can see all avatars
CREATE POLICY "Admins can manage all avatars" ON user_avatars
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_avatars_user_id ON user_avatars(user_id);
CREATE INDEX IF NOT EXISTS idx_user_avatars_status ON user_avatars(status);
CREATE INDEX IF NOT EXISTS idx_user_avatars_created_at ON user_avatars(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_avatars_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_user_avatars_updated_at
  BEFORE UPDATE ON user_avatars
  FOR EACH ROW
  EXECUTE FUNCTION update_user_avatars_updated_at();

-- Function to clean up old failed avatar records (optional)
CREATE OR REPLACE FUNCTION cleanup_failed_avatars()
RETURNS void AS $$
BEGIN
  -- Delete failed avatar records older than 7 days
  DELETE FROM user_avatars
  WHERE status = 'failed'
  AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
