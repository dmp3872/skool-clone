-- Add parent_id column to comments table for threaded/nested comments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE comments ADD COLUMN parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for faster parent comment lookups
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- Add index for faster post + parent lookups
CREATE INDEX IF NOT EXISTS idx_comments_post_parent ON comments(post_id, parent_id);

-- Update RLS policies to allow users to see all comments in a thread
-- (No changes needed - existing policies already allow reading all comments for a post)

-- Add comments to track replies count (optional, for performance)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'replies_count'
  ) THEN
    ALTER TABLE comments ADD COLUMN replies_count INTEGER DEFAULT 0;
  END IF;
END $$;

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