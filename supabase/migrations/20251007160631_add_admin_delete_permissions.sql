/*
  # Add Admin Delete Permissions

  ## Overview
  Adds RLS policies to allow admins and moderators to delete posts.

  ## Changes
  1. Add policy for admins to delete any post
  2. Add policy for admins to update any post (for pinning)

  ## Security
  - Only users with admin or moderator role can delete/update any post
  - Regular users can still only delete their own posts
*/

-- Allow admins and moderators to delete any post
CREATE POLICY "Admins can delete any post"
  ON posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
    )
  );

-- Allow admins and moderators to update any post (for pinning)
CREATE POLICY "Admins can update any post"
  ON posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
    )
  );