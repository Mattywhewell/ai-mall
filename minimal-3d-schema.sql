-- ===========================================
-- MINIMAL 3D GENERATION SYSTEM SCHEMA
-- Run this in Supabase SQL Editor if migrations fail
-- ===========================================

-- Create profiles table if it doesn't exist (minimal version)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user',
  avatar_model_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Basic profile policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin Assets Table for 3D Model Generation
CREATE TABLE IF NOT EXISTS admin_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  asset_type VARCHAR(50) NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_format VARCHAR(10) NOT NULL,
  file_size_bytes BIGINT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Avatars Table
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

-- Enable RLS
ALTER TABLE admin_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_avatars ENABLE ROW LEVEL SECURITY;

-- Admin assets policies
CREATE POLICY "Admins can manage admin_assets" ON admin_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Authenticated users can read admin_assets" ON admin_assets
  FOR SELECT USING (auth.role() = 'authenticated');

-- User avatars policies
CREATE POLICY "Users can view own avatars" ON user_avatars
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own avatars" ON user_avatars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own avatars" ON user_avatars
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all avatars" ON user_avatars
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_assets_type ON admin_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_admin_assets_created_at ON admin_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_assets_tags ON admin_assets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_admin_assets_created_by ON admin_assets(created_by);

CREATE INDEX IF NOT EXISTS idx_user_avatars_user_id ON user_avatars(user_id);
CREATE INDEX IF NOT EXISTS idx_user_avatars_status ON user_avatars(status);
CREATE INDEX IF NOT EXISTS idx_user_avatars_created_at ON user_avatars(created_at DESC);

-- Update functions
CREATE OR REPLACE FUNCTION update_admin_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_avatars_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_update_admin_assets_updated_at
  BEFORE UPDATE ON admin_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_assets_updated_at();

CREATE TRIGGER trigger_update_user_avatars_updated_at
  BEFORE UPDATE ON user_avatars
  FOR EACH ROW
  EXECUTE FUNCTION update_user_avatars_updated_at();