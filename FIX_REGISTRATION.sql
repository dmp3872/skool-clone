/*
  ============================================================================
  FIX: User Registration RLS Policy Issue
  ============================================================================

  PROBLEM:
  Users cannot sign up because the INSERT policy on the users table is too
  restrictive and blocks new user registration.

  SOLUTION:
  This script updates the RLS policy to allow authenticated users to insert
  their own profile during registration.

  HOW TO APPLY:
  1. Go to your Supabase Dashboard (https://supabase.com/dashboard)
  2. Select your project
  3. Navigate to "SQL Editor" in the left sidebar
  4. Click "New Query"
  5. Copy and paste this ENTIRE file into the editor
  6. Click "Run" or press Cmd/Ctrl + Enter
  7. Verify you see "Success. No rows returned" message

  After applying this fix, users will be able to register for accounts again.
  ============================================================================
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create new INSERT policy that allows authenticated users to create their profile
-- This policy allows the registration flow to work:
-- 1. Supabase Auth creates the auth user
-- 2. The user is now authenticated with auth.uid()
-- 3. This policy allows them to insert a row with id = auth.uid()
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

/*
  ============================================================================
  VERIFICATION:

  After running this script, test user registration:
  1. Open your app in an incognito/private browser window
  2. Try to create a new account
  3. Registration should now work successfully
  4. The new user will have approval_status = 'pending'
  5. Admin can approve the user from the Admin panel > Approvals tab
  ============================================================================
*/
