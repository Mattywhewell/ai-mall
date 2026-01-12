-- Audio Assets Management Migration
-- Adds support for custom audio file uploads in the admin dashboard

-- Create audio_assets table
CREATE TABLE IF NOT EXISTS audio_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- asset key (e.g., 'cosmic-ambient')
    original_name VARCHAR(255) NOT NULL, -- original filename
    file_url TEXT NOT NULL, -- Supabase storage URL
    file_format VARCHAR(10) NOT NULL, -- mp3, wav, etc.
    file_size_bytes INTEGER NOT NULL,
    duration_seconds DECIMAL(8,2), -- optional duration in seconds
    description TEXT, -- optional description
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for fast lookups
CREATE INDEX IF NOT EXISTS idx_audio_assets_name ON audio_assets(name);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_audio_assets_active ON audio_assets(is_active);

-- Add RLS policies
ALTER TABLE audio_assets ENABLE ROW LEVEL SECURITY;

-- Policy for admin users to manage audio assets
CREATE POLICY "Admin users can manage audio assets" ON audio_assets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin')
        )
    );

-- Policy for public read access (needed for audio loading)
CREATE POLICY "Public can read active audio assets" ON audio_assets
    FOR SELECT USING (is_active = true);

-- Create storage bucket for audio files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-assets', 'audio-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for audio-assets bucket
CREATE POLICY "Admin users can upload audio files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'audio-assets'
        AND EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin')
        )
    );

CREATE POLICY "Admin users can update audio files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'audio-assets'
        AND EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin')
        )
    );

CREATE POLICY "Admin users can delete audio files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'audio-assets'
        AND EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin')
        )
    );

CREATE POLICY "Public can read audio files" ON storage.objects
    FOR SELECT USING (bucket_id = 'audio-assets');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_audio_asset_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_audio_asset_updated_at
    BEFORE UPDATE ON audio_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_audio_asset_updated_at();

-- Insert sample data (optional - for testing)
-- These would be the default files that come with the system
INSERT INTO audio_assets (name, original_name, file_url, file_format, file_size_bytes, description, is_active)
VALUES
    ('cosmic-ambient', 'cosmic-ambient.wav', '/sounds/cosmic-ambient.wav', 'wav', 0, 'Default cosmic ambient background', false),
    ('energy-hum', 'energy-hum.wav', '/sounds/energy-hum.wav', 'wav', 0, 'Default energy field hum', false),
    ('particle-field', 'particle-field.wav', '/sounds/particle-field.wav', 'wav', 0, 'Default particle field ambiance', false),
    ('node-hover', 'node-hover.wav', '/sounds/node-hover.wav', 'wav', 0, 'Default node hover sound', false),
    ('node-click', 'node-click.wav', '/sounds/node-click.wav', 'wav', 0, 'Default node click sound', false),
    ('portal-open', 'portal-open.wav', '/sounds/portal-open.wav', 'wav', 0, 'Default portal opening sound', false),
    ('welcome-chime', 'welcome-chime.wav', '/sounds/welcome-chime.wav', 'wav', 0, 'Default welcome chime', false)
ON CONFLICT (name) DO NOTHING;