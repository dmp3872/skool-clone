/*
  # Fix User Registration RLS Policy

  ## Problem
  Users cannot register because INSERT policy requires auth.uid() = id,
  but the user doesn't exist in the users table yet during registration.

  ## Solution
  Update the INSERT policy to allow authenticated users to insert their own profile
  using their auth.uid() as the id.
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create new INSERT policy that allows authenticated users to create their profile
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());