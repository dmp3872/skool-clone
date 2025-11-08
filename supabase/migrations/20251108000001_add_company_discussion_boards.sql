/*
  # Add Company Discussion Boards

  ## Overview
  Adds support for company-specific discussion boards where users can post
  about specific peptide suppliers.

  ## Changes
  1. Add company_id field to posts table
  2. Add index for faster company-specific queries
  3. Allow company_id to be nullable (posts can be general or company-specific)

  ## Usage
  - Users can create posts associated with a specific company
  - Company pages show all posts for that company
  - Posts without company_id remain in general feed
*/

-- Add company_id to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS company_id TEXT;

-- Add index for company_id lookups
CREATE INDEX IF NOT EXISTS idx_posts_company_id ON posts(company_id);

-- Add comment for documentation
COMMENT ON COLUMN posts.company_id IS 'Optional company ID from companiesData.ts - links post to specific peptide supplier discussion board';
