/*
  # Supabase Storage Setup for Video Hosting

  ## Manual Steps Required in Supabase Dashboard

  1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets

  2. Create a new bucket:
     - Click "Create a new bucket"
     - Bucket name: "videos"
     - Public bucket: NO (keep it private for access control)
     - Click "Create bucket"

  3. Set up Storage Policies:
     The RLS policies below will be applied automatically via this migration.

  ## Features
  - Private video storage with access control
  - Authenticated users can view videos
  - Only admins can upload/delete videos
  - Signed URLs for secure video access
*/

-- Create storage policies for videos bucket
-- Note: The bucket must be created manually in Supabase dashboard first

-- Allow authenticated users to download videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone authenticated can view videos
CREATE POLICY "Authenticated users can view videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'videos');

-- Policy: Only admins can upload videos
CREATE POLICY "Admins can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND
  is_admin()
);

-- Policy: Only admins can delete videos
CREATE POLICY "Admins can delete videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' AND
  is_admin()
);

-- Policy: Only admins can update video metadata
CREATE POLICY "Admins can update videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos' AND
  is_admin()
)
WITH CHECK (
  bucket_id = 'videos' AND
  is_admin()
);

-- Add column to track if video is uploaded to storage vs external URL
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS video_storage_path TEXT,
ADD COLUMN IF NOT EXISTS video_type TEXT DEFAULT 'url' CHECK(video_type IN ('url', 'upload'));

-- Add index for faster video lookups
CREATE INDEX IF NOT EXISTS idx_lessons_video_storage_path ON lessons(video_storage_path);

-- Add comments
COMMENT ON COLUMN lessons.video_storage_path IS 'Path to video file in Supabase Storage (if video_type = upload)';
COMMENT ON COLUMN lessons.video_type IS 'Type of video: url (external) or upload (Supabase Storage)';