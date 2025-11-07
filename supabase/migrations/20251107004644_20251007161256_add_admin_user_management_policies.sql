/*
  # Add Admin User Management Policies

  ## Overview
  Adds RLS policies to allow admins to update user roles and manage users.

  ## Changes
  1. Add policy for admins to update any user's profile (including role changes)
  2. Ensure admins can manage user accounts

  ## Security
  - Only users with admin role can update other users' profiles
  - Regular users can still only update their own profiles
  - Moderators cannot change user roles (only admins can)
*/

-- Allow admins to update any user (for role changes and user management)
CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );