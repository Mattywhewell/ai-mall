-- Video Assets Management Migration
-- Adds support for custom video file uploads in the admin dashboard

-- Create video_assets table
CREATE TABLE IF NOT EXISTS video_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- asset key (e.g., 'product-showcase')
    original_name VARCHAR(255) NOT NULL, -- original filename
    file_url TEXT NOT NULL, -- Supabase storage URL
    file_format VARCHAR(10) NOT NULL, -- mp4, webm, etc.
    file_size_bytes INTEGER NOT NULL,
    duration_seconds DECIMAL(8,2), -- video duration in seconds
    resolution_width INTEGER, -- video width in pixels
    resolution_height INTEGER, -- video height in pixels
    description TEXT, -- optional description
    tags TEXT[], -- array of tags for categorization
    -- Scheduling fields allow admin to schedule videos for playback
    schedule_start TIMESTAMP WITH TIME ZONE,
    schedule_end TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for fast lookups
CREATE INDEX IF NOT EXISTS idx_video_assets_name ON video_assets(name);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_video_assets_active ON video_assets(is_active);

-- Create index on tags for searching
CREATE INDEX IF NOT EXISTS idx_video_assets_tags ON video_assets USING GIN(tags);

-- Add RLS policies
ALTER TABLE video_assets ENABLE ROW LEVEL SECURITY;

-- Policy for admin users to manage video assets
CREATE POLICY "Admin users can manage video assets" ON video_assets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin')
        )
    );

-- Policy for public read access (needed for video loading)
CREATE POLICY "Public can read active video assets" ON video_assets
    FOR SELECT USING (is_active = true);

-- Create storage bucket for video files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-assets', 'video-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for video-assets bucket
CREATE POLICY "Admin users can upload video files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'video-assets'
        AND EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin')
        )
    );

CREATE POLICY "Admin users can update video files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'video-assets'
        AND EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin')
        )
    );

CREATE POLICY "Admin users can delete video files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'video-assets'
        AND EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin')
        )
    );

-- Public read access for video files
CREATE POLICY "Public can read video files" ON storage.objects
    FOR SELECT USING (bucket_id = 'video-assets');

-- Insert some default video asset entries (these would be uploaded via admin panel)
INSERT INTO video_assets (name, original_name, file_url, file_format, file_size_bytes, duration_seconds, resolution_width, resolution_height, description, tags, is_active) VALUES
('product-showcase', 'product-showcase.mp4', '/videos/product-showcase.mp4', 'mp4', 5242880, 30.5, 1920, 1080, 'Product showcase video for featured items', ARRAY['showcase', 'product', 'featured'], true),
('store-tour', 'store-tour.mp4', '/videos/store-tour.mp4', 'mp4', 8388608, 45.2, 1920, 1080, 'Virtual store tour experience', ARRAY['tour', 'store', 'virtual'], true),
('creator-spotlight', 'creator-spotlight.mp4', '/videos/creator-spotlight.mp4', 'mp4', 4194304, 22.8, 1920, 1080, 'Featured creator spotlight video', ARRAY['creator', 'spotlight', 'featured'], true),
('district-intro', 'district-intro.mp4', '/videos/district-intro.mp4', 'mp4', 3145728, 15.3, 1920, 1080, 'District introduction video', ARRAY['district', 'intro', 'welcome'], true)
ON CONFLICT (name) DO NOTHING;