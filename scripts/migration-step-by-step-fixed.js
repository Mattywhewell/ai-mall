#!/usr/bin/env node

/**
 * 3D Assets Migration - Step by Step Execution Guide
 * Provides individual SQL statements for manual execution
 */

console.log('🔮 AIVERSE 3D ASSETS MIGRATION - STEP BY STEP');
console.log('==============================================\n');

console.log('📋 EXECUTION INSTRUCTIONS:');
console.log('1. Open Supabase SQL Editor');
console.log('2. Copy ONE statement at a time');
console.log('3. Click "Run" (NOT "Explain")');
console.log('4. Repeat for each statement below\n');

console.log('⚠️  IMPORTANT:');
console.log('• Execute statements in order');
console.log('• Some may show "already exists" - this is normal');
console.log('• Do NOT use "Explain" - use "Run"');
console.log('• If a statement fails, continue with the next one\n');

console.log('='.repeat(80));

// Define the individual statements manually for better control
const statements = [
  // Table creation
  `CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('model', 'scene', 'avatar', 'sigil', 'ritual-object', 'district-asset')),
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  file_format TEXT,
  created_by TEXT NOT NULL,
  created_from_upload_id UUID,
  district_assignment TEXT,
  ritual_assignment TEXT,
  citizen_archetype TEXT,
  generation_prompt TEXT,
  generation_model TEXT DEFAULT 'gpt-4',
  generation_timestamp TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)`,

  // Indexes for assets
  `CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type)`,
  `CREATE INDEX IF NOT EXISTS idx_assets_created_by ON assets(created_by)`,
  `CREATE INDEX IF NOT EXISTS idx_assets_district ON assets(district_assignment)`,
  `CREATE INDEX IF NOT EXISTS idx_assets_ritual ON assets(ritual_assignment)`,
  `CREATE INDEX IF NOT EXISTS idx_assets_public ON assets(is_public) WHERE is_public = true`,
  `CREATE INDEX IF NOT EXISTS idx_assets_featured ON assets(is_featured) WHERE is_featured = true`,

  // Uploads table
  `CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  upload_type TEXT NOT NULL CHECK (upload_type IN ('admin_input', 'user_selfie', 'admin_scene')),
  purpose TEXT,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  generated_asset_ids UUID[] DEFAULT ARRAY[]::UUID[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
)`,

  // Indexes for uploads
  `CREATE INDEX IF NOT EXISTS idx_uploads_user ON uploads(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_uploads_type ON uploads(upload_type)`,
  `CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(processing_status)`,

  // Extend profiles table
  `ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_model_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_generation_status TEXT DEFAULT 'none' CHECK (avatar_generation_status IN ('none', 'generating', 'ready', 'failed')),
ADD COLUMN IF NOT EXISTS avatar_upload_id UUID REFERENCES uploads(id)`,

  // RLS for assets
  `ALTER TABLE assets ENABLE ROW LEVEL SECURITY`,

  // Assets policies
  `CREATE POLICY "Public assets are viewable by everyone" ON assets
  FOR SELECT USING (is_public = true)`,

  `CREATE POLICY "Users can view their own assets" ON assets
  FOR SELECT USING (created_by = auth.uid()::text)`,

  `CREATE POLICY "Admins can manage all assets" ON assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND role IN ('admin', 'creator', 'architect')
    )
  )`,

  // RLS for uploads
  `ALTER TABLE uploads ENABLE ROW LEVEL SECURITY`,

  // Uploads policies
  `CREATE POLICY "Users can view their own uploads" ON uploads
  FOR SELECT USING (user_id = auth.uid()::text)`,

  `CREATE POLICY "Users can create their own uploads" ON uploads
  FOR INSERT WITH CHECK (user_id = auth.uid()::text)`,

  `CREATE POLICY "Admins can manage all uploads" ON uploads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND role IN ('admin', 'creator', 'architect')
    )
  )`,

  // Functions
  `CREATE OR REPLACE FUNCTION increment_asset_usage(asset_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE assets
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = asset_id;
END;
$$`,

  `CREATE OR REPLACE FUNCTION link_upload_to_asset(upload_id UUID, asset_id UUID)
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
$$`,

  `CREATE OR REPLACE FUNCTION update_user_avatar_status(user_id TEXT, status TEXT, avatar_url TEXT DEFAULT NULL)
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
$$`,

  // Storage buckets
  `INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING`,

  `INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING`,

  // Storage policies
  `CREATE POLICY "Users can upload their own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )`,

  `CREATE POLICY "Users can view their own uploads" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )`,

  `CREATE POLICY "Public assets are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'assets')`,

  `CREATE POLICY "Admins can manage assets" ON storage.objects
  FOR ALL USING (
    bucket_id = 'assets'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text
      AND role IN ('admin', 'creator', 'architect')
    )
  )`,

  // Seed data
  `INSERT INTO assets (type, name, description, file_url, created_by, district_assignment, is_public, tags, metadata)
VALUES
  ('district-asset', 'Ember District Sigil', 'The pulsing heart of transformation and rebirth', '/assets/sigils/ember-district-sigil.glb', 'system', 'ember', true, ARRAY['sigil', 'district', 'ember'], '{"mythic_tone": "pulse_ember", "ritual": "forging"}'),
  ('district-asset', 'Lumen District Beacon', 'Guiding light through the fog of uncertainty', '/assets/sigils/lumen-district-beacon.glb', 'system', 'lumen', true, ARRAY['sigil', 'district', 'lumen'], '{"mythic_tone": "lumen_gold", "ritual": "guidance"}'),
  ('ritual-object', 'Arrival Mirror', 'The reflective surface that welcomes new citizens', '/assets/rituals/arrival-mirror.glb', 'system', null, true, ARRAY['ritual', 'arrival', 'mirror'], '{"mythic_tone": "fog_silver", "archetype": "wanderer"}')
ON CONFLICT DO NOTHING`
];

console.log('📜 INDIVIDUAL SQL STATEMENTS TO EXECUTE:\n');

statements.forEach((statement, index) => {
  console.log(`🔄 STATEMENT ${index + 1}/${statements.length}`);
  console.log('-'.repeat(50));
  console.log(statement + ';');
  console.log('');
  console.log('💡 Copy the above statement and run it in Supabase SQL Editor');
  console.log('   Click "Run" (NOT "Explain") then proceed to next statement\n');
});

console.log('='.repeat(80));
console.log('✅ AFTER EXECUTING ALL STATEMENTS:');
console.log('   node scripts/quick-api-test.js');
console.log('');
console.log('🎯 This will create:');
console.log('   • assets table (3D models, scenes, avatars)');
console.log('   • uploads table (file processing)');
console.log('   • Extended profiles table with avatar support');
console.log('   • RLS policies and storage buckets');