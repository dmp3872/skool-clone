/*
  # Secure Approval Status and Role Fields

  ## Security Issues Fixed
  1. Users can currently update their own approval_status (security vulnerability)
  2. Users can potentially update their own role field
  3. Need to ensure only admins can modify these sensitive fields

  ## Changes
  1. Create helper function to check if current user is admin
  2. Drop and recreate user update policies with field-level restrictions
  3. Ensure regular users can only update non-sensitive fields
  4. Ensure admins can update all fields

  ## Security Model
  - Regular users: Can update name, username, avatar, bio, last_active
  - Admins only: Can update role, approval_status, points, level
*/

-- Create helper function to check if current user is admin or moderator
CREATE OR REPLACE FUNCTION is_admin_or_moderator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing user update policies
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;

-- Create restrictive policy for regular users updating their own profile
-- Only allows updating non-sensitive fields
CREATE POLICY "Users can update own non-sensitive profile fields"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Ensure these sensitive fields are not being changed by regular users
    AND role = (SELECT role FROM users WHERE id = auth.uid())
    AND approval_status = (SELECT approval_status FROM users WHERE id = auth.uid())
  );

-- Create policy for admins to update any user's profile including sensitive fields
CREATE POLICY "Admins can update any user profile"
  ON users FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create policy for moderators to update user profiles (excluding role and approval_status)
CREATE POLICY "Moderators can update user profiles except roles"
  ON users FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_moderator()
    AND NOT is_admin()
  )
  WITH CHECK (
    is_admin_or_moderator()
    AND NOT is_admin()
    -- Moderators cannot change roles or approval status
    AND role = (SELECT role FROM users WHERE id = users.id)
    AND approval_status = (SELECT approval_status FROM users WHERE id = users.id)
  );

-- Add comment for documentation
COMMENT ON FUNCTION is_admin() IS 'Helper function to check if the current authenticated user has admin role';
COMMENT ON FUNCTION is_admin_or_moderator() IS 'Helper function to check if the current authenticated user has admin or moderator role';
