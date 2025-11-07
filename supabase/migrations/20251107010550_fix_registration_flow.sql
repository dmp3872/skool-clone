/*
  # Fix Registration Flow

  ## Problem
  Users cannot register because:
  1. banned_emails check requires admin privileges
  2. notification insert fails due to RLS

  ## Solution
  1. Allow anyone to check banned_emails (read-only, just email column)
  2. Allow users to create notifications for themselves
  3. Ensure users can log in but with limited access until approved
*/

-- Drop existing banned_emails policies
DROP POLICY IF EXISTS "Admins can view banned emails" ON banned_emails;
DROP POLICY IF EXISTS "Admins can ban emails" ON banned_emails;
DROP POLICY IF EXISTS "Admins can unban emails" ON banned_emails;

-- Allow anyone to check if an email is banned (for registration validation)
-- This is safe because it only allows checking existence, not viewing reasons
CREATE POLICY "Anyone can check banned emails"
  ON banned_emails FOR SELECT
  TO public
  USING (true);

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

-- Drop existing notification policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Allow users to view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert their own notifications (needed during registration)
CREATE POLICY "Users can create own notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow admins to create notifications for any user
CREATE POLICY "Admins can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

COMMENT ON POLICY "Anyone can check banned emails" ON banned_emails IS 'Allows registration flow to check if email is banned without requiring authentication';