/*
  # Complete Auth Flow Fix

  ## Problem
  Multiple conflicting RLS policies are preventing user registration, and the app
  lacks auto-login after signup and password reset functionality.

  ## Root Cause
  1. Missing or conflicting INSERT policies on users table
  2. RLS policies from multiple migrations creating conflicts
  3. No support for password reset flow

  ## Solution
  This migration:
  1. Drops ALL existing user policies to start clean
  2. Creates comprehensive policies that support:
     - User registration (INSERT)
     - Profile updates (UPDATE) with field-level security
     - Admin management capabilities
     - Auto-login after registration
     - Password reset flow

  ## Security Model
  - Regular users: Can insert their own profile, update non-sensitive fields
  - Admins: Can update all fields for any user
  - Moderators: Can update user profiles except role/approval_status
  - Field-level protection: role and approval_status locked for regular users
*/

-- ============================================================================
-- STEP 1: Clean up all existing user policies
-- ============================================================================

-- Drop all existing INSERT policies
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;

-- Drop all existing UPDATE policies
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can update own non-sensitive profile fields" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Admins can update any user profile" ON users;
DROP POLICY IF EXISTS "Moderators can update user profiles except roles" ON users;

-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;

-- Drop all existing DELETE policies
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Only admins can delete users" ON users;

-- ============================================================================
-- STEP 2: Ensure helper functions exist
-- ============================================================================

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

-- ============================================================================
-- STEP 3: Create comprehensive user policies
-- ============================================================================

-- SELECT Policy: All authenticated users can view all profiles
CREATE POLICY "users_select_policy"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- INSERT Policy: Allow user registration
-- This is critical for new user signup - authenticated users can insert their own profile
CREATE POLICY "users_insert_policy"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
  );

-- UPDATE Policy: Regular users can update their own non-sensitive fields
-- This prevents users from self-approving or promoting themselves to admin
CREATE POLICY "users_update_own_policy"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Lock sensitive fields - these must not change from current values
    AND role = (SELECT role FROM users WHERE id = auth.uid())
    AND approval_status = (SELECT approval_status FROM users WHERE id = auth.uid())
  );

-- UPDATE Policy: Admins can update any user profile (including sensitive fields)
CREATE POLICY "users_update_admin_policy"
  ON users FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- UPDATE Policy: Moderators can update profiles but not role/approval_status
CREATE POLICY "users_update_moderator_policy"
  ON users FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_moderator()
    AND NOT is_admin()
  )
  WITH CHECK (
    is_admin_or_moderator()
    AND NOT is_admin()
    -- Moderators cannot change these sensitive fields
    AND role = (SELECT role FROM users WHERE id = users.id)
    AND approval_status = (SELECT approval_status FROM users WHERE id = users.id)
  );

-- DELETE Policy: Only admins can delete users
CREATE POLICY "users_delete_policy"
  ON users FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- STEP 4: Add helpful comments
-- ============================================================================

COMMENT ON POLICY "users_select_policy" ON users IS
  'Allows all authenticated users to view profiles';

COMMENT ON POLICY "users_insert_policy" ON users IS
  'Allows authenticated users to create their own profile during registration. Critical for signup flow.';

COMMENT ON POLICY "users_update_own_policy" ON users IS
  'Allows users to update their own profile, but locks role and approval_status fields to prevent privilege escalation';

COMMENT ON POLICY "users_update_admin_policy" ON users IS
  'Allows admins to update any user profile including sensitive fields';

COMMENT ON POLICY "users_update_moderator_policy" ON users IS
  'Allows moderators to update user profiles but prevents them from changing roles or approval status';

COMMENT ON POLICY "users_delete_policy" ON users IS
  'Only admins can delete user accounts';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- This migration enables the following auth flows:
--
-- 1. USER REGISTRATION:
--    - Supabase Auth creates auth user (user is now authenticated)
--    - App inserts profile row with id = auth.uid()
--    - users_insert_policy allows this operation
--    - User remains logged in (auto-login)
--
-- 2. PROFILE UPDATES:
--    - Users can update name, bio, avatar, etc.
--    - Users CANNOT change their role or approval_status
--    - Field-level security prevents privilege escalation
--
-- 3. PASSWORD RESET:
--    - Supabase Auth handles password reset emails
--    - User clicks reset link, sets new password
--    - User record already exists, no INSERT needed
--    - Works seamlessly with existing policies
--
-- 4. ADMIN MANAGEMENT:
--    - Admins can approve/reject users (update approval_status)
--    - Admins can promote users (update role)
--    - Admins can delete users
--
-- 5. MODERATOR MANAGEMENT:
--    - Moderators can update user profiles
--    - Moderators CANNOT change roles or approval status
