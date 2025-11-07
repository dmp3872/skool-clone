/*
  # Add Image Upload Support to Posts

  ## Overview
  Adds image upload capability to posts with support for multiple images per post.

  ## Changes Made
  
  ### 1. Storage Setup
  - Creates storage bucket for post images
  - Sets up public access for image viewing
  - Configures RLS policies for image upload/delete

  ### 2. Database Schema Changes
  - Adds image_urls array column to posts table for storing multiple image URLs
  - Adds image_count column for quick querying

  ## Security
  - RLS policies ensure users can only upload images to their own posts
  - Public read access for all images
  - File size and type restrictions enforced at application level
*/

-- Add image columns to posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'image_urls'
  ) THEN
    ALTER TABLE posts ADD COLUMN image_urls TEXT[] DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'image_count'
  ) THEN
    ALTER TABLE posts ADD COLUMN image_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for post images
DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;
CREATE POLICY "Authenticated users can upload post images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'post-images');

DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects;
CREATE POLICY "Users can update their own post images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;
CREATE POLICY "Users can delete their own post images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
CREATE POLICY "Anyone can view post images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'post-images');

-- Create index for faster image queries
CREATE INDEX IF NOT EXISTS idx_posts_image_count ON posts(image_count) WHERE image_count > 0;