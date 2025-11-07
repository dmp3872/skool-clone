/*
  # Add Permanent Email Ban System

  ## Overview
  Separate "kick" from "ban" functionality:
  - Kick: Remove user, they CAN register again with same email
  - Ban: Remove user, email is PERMANENTLY blocked from registration

  ## Changes
  1. Create banned_emails table for permanent email blacklist
  2. Add RLS policies for admin-only access
  3. Add indexes for fast email lookup during registration

  ## Security
  - Only admins can add/remove emails from ban list
  - Registration will check this table before allowing signup
  - Separate from user_bans table (which tracks current user bans)
*/

-- Create is_admin helper function if it doesn't exist
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Create banned_emails table for permanent email blacklist
CREATE TABLE IF NOT EXISTS banned_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  banned_by UUID REFERENCES users(id),
  reason TEXT NOT NULL,
  banned_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE banned_emails ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view banned emails" ON banned_emails;
DROP POLICY IF EXISTS "Admins can ban emails" ON banned_emails;
DROP POLICY IF EXISTS "Admins can unban emails" ON banned_emails;

-- Only admins can view banned emails
CREATE POLICY "Admins can view banned emails"
  ON banned_emails FOR SELECT
  TO authenticated
  USING (is_admin());

-- Only admins can add emails to ban list
CREATE POLICY "Admins can ban emails"
  ON banned_emails FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Only admins can remove emails from ban list
CREATE POLICY "Admins can unban emails"
  ON banned_emails FOR DELETE
  TO authenticated
  USING (is_admin());

-- Create index for fast email lookups during registration
CREATE INDEX IF NOT EXISTS idx_banned_emails_email ON banned_emails(email);

-- Add comment
COMMENT ON TABLE banned_emails IS 'Permanently banned email addresses that cannot register new accounts';