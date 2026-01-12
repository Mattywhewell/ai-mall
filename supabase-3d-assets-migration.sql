-- Migration: Add 3D Avatar and Asset Generation Features
-- Date: January 10, 2026

-- Add avatar_model_url to users table for 3D avatars
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_model_url TEXT;

-- Create admin_assets table for admin-generated 3D models
CREATE TABLE IF NOT EXISTS admin_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('3d_model', 'scene', 'texture', 'material')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_format TEXT NOT NULL CHECK (file_format IN ('glb', 'gltf', 'obj', 'fbx', 'png', 'jpg', 'json')),
  file_size_bytes INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  created_by TEXT NOT NULL, -- admin user ID
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_3d_avatars table for user-generated avatars
CREATE TABLE IF NOT EXISTS user_3d_avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  avatar_model_url TEXT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  generation_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create asset_generation_jobs table for tracking generation tasks
CREATE TABLE IF NOT EXISTS asset_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL CHECK (job_type IN ('image_to_3d', 'selfie_to_avatar', 'scene_generation')),
  source_url TEXT NOT NULL,
  output_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  user_id TEXT, -- null for admin jobs
  admin_id TEXT, -- null for user jobs
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_assets_created_by ON admin_assets(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_assets_type ON admin_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_user_3d_avatars_user_id ON user_3d_avatars(user_id);
CREATE INDEX IF NOT EXISTS idx_user_3d_avatars_status ON user_3d_avatars(status);
CREATE INDEX IF NOT EXISTS idx_asset_generation_jobs_type ON asset_generation_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_asset_generation_jobs_status ON asset_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_asset_generation_jobs_user ON asset_generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_generation_jobs_admin ON asset_generation_jobs(admin_id);

-- RLS Policies
ALTER TABLE admin_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_3d_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Admin assets: only admins can access
CREATE POLICY "Admin assets are viewable by admins" ON admin_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id::text = admin_assets.created_by
      AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
    )
  );

CREATE POLICY "Admin assets are insertable by admins" ON admin_assets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id::text = created_by
      AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
    )
  );

-- User 3D avatars: users can only access their own
CREATE POLICY "Users can view their own 3D avatars" ON user_3d_avatars
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own 3D avatars" ON user_3d_avatars
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own 3D avatars" ON user_3d_avatars
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Asset generation jobs: users see their own, admins see all
CREATE POLICY "Users can view their own generation jobs" ON asset_generation_jobs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Admins can view all generation jobs" ON asset_generation_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
    )
  );

CREATE POLICY "Users can insert their own generation jobs" ON asset_generation_jobs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Admins can insert generation jobs" ON asset_generation_jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
    )
  );