/*
  # Fix User Registration RLS Policy

  ## Overview
  Fixes the RLS policy to allow users to insert their own profile during registration.
  The previous policy only allowed SELECT and UPDATE, but not INSERT.

  ## Changes
  1. Add INSERT policy for users to create their own profile
  2. Policy checks that the user_id matches the authenticated user's ID

  ## Security
  - Users can only insert their own profile (auth.uid() = id)
  - Maintains security by preventing users from creating profiles for others
*/

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Allow users to insert their own profile during registration
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);