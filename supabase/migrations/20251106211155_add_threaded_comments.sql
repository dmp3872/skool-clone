/*
  # Add Threaded Comments Support

  1. Schema Changes
    - Add `parent_id` column to `comments` table to enable comment replies
    - Add `replies_count` column to track number of replies per comment

  2. Performance Optimizations
    - Create index on `parent_id` for faster parent comment lookups
    - Create composite index on `post_id` and `parent_id` for efficient thread queries

  3. Helper Functions
    - `increment_comment_replies()` - Increments reply count when a reply is added
    - `decrement_comment_replies()` - Decrements reply count when a reply is deleted

  4. Security
    - Existing RLS policies continue to apply
    - Helper functions use SECURITY DEFINER for safe counter updates
*/

-- Add parent_id column to comments table for threaded/nested comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- Add index for faster parent comment lookups
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- Add index for faster post + parent lookups
CREATE INDEX IF NOT EXISTS idx_comments_post_parent ON comments(post_id, parent_id);

-- Add comments to track replies count (optional, for performance)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS replies_count INTEGER DEFAULT 0;

-- Create function to increment replies count
CREATE OR REPLACE FUNCTION increment_comment_replies(comment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE comments
  SET replies_count = replies_count + 1
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to decrement replies count
CREATE OR REPLACE FUNCTION decrement_comment_replies(comment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE comments
  SET replies_count = GREATEST(0, replies_count - 1)
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
