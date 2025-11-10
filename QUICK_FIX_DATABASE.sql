/*
  ===============================================================================
  QUICK FIX: Apply All Recent Database Changes
  ===============================================================================

  This script applies all recent database migrations that may not have been
  run yet. Run this in Supabase SQL Editor to fix post creation errors.

  HOW TO APPLY:
  1. Go to your Supabase Dashboard (https://supabase.com/dashboard)
  2. Select your project
  3. Click "SQL Editor" in the left sidebar
  4. Click "New Query"
  5. Copy and paste this ENTIRE file
  6. Click "Run" (or press Cmd/Ctrl + Enter)
  7. Verify you see "Success" message

  ===============================================================================
*/

-- ============================================================================
-- FIX 1: Add company_id to posts table (for company discussion boards)
-- ============================================================================

-- Check if column exists, add if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='posts' AND column_name='company_id'
  ) THEN
    ALTER TABLE posts ADD COLUMN company_id TEXT;
    CREATE INDEX idx_posts_company_id ON posts(company_id);
    RAISE NOTICE 'Added company_id column to posts table';
  ELSE
    RAISE NOTICE 'company_id column already exists';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check the posts table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'posts'
ORDER BY ordinal_position;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database update complete!';
  RAISE NOTICE 'You can now create posts with company selection.';
END $$;
