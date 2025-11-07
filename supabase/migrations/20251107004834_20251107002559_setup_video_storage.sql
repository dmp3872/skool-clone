/*
  # Supabase Storage Setup for Video Hosting

  ## Features
  - Private video storage with access control
  - Authenticated users can view videos
  - Only admins can upload/delete videos
  - Signed URLs for secure video access
*/

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update videos" ON storage.objects;

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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'video_storage_path'
  ) THEN
    ALTER TABLE lessons ADD COLUMN video_storage_path TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'video_type'
  ) THEN
    ALTER TABLE lessons ADD COLUMN video_type TEXT DEFAULT 'url' CHECK(video_type IN ('url', 'upload'));
  END IF;
END $$;

-- Add index for faster video lookups
CREATE INDEX IF NOT EXISTS idx_lessons_video_storage_path ON lessons(video_storage_path);

-- Add comments
COMMENT ON COLUMN lessons.video_storage_path IS 'Path to video file in Supabase Storage (if video_type = upload)';
COMMENT ON COLUMN lessons.video_type IS 'Type of video: url (external) or upload (Supabase Storage)';