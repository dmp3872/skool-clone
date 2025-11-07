/*
  # Fix User Registration INSERT Policy

  ## Problem
  The current INSERT policy requires approval_status = 'approved',
  but new users need to register with approval_status = 'pending'.

  ## Solution
  Update the INSERT policy to allow users to create their profile
  with any approval_status as long as the id matches their auth.uid().
  The application code will set approval_status to 'pending' by default.
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create new INSERT policy that allows pending users
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
  );

COMMENT ON POLICY "Users can insert own profile" ON users IS 
'Allows authenticated users to create their own profile during registration. 
Application code sets approval_status to pending by default.';