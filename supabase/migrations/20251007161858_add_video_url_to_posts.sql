/*
  # Add Video URL to Posts

  ## Overview
  Adds video_url field to posts table to support embedding YouTube videos in posts.

  ## Changes
  1. Add video_url column to posts table (nullable text field)

  ## Notes
  - Video URLs will be converted to YouTube embed URLs in the frontend
  - Supports various YouTube URL formats (watch, youtu.be, embed)
*/

-- Add video_url column to posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE posts ADD COLUMN video_url TEXT;
  END IF;
END $$;