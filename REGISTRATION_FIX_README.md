# User Registration Fix

## The Problem

Users cannot sign up for new accounts. When they try to register, the registration fails due to a Row Level Security (RLS) policy issue in the Supabase database.

## Root Cause

The `users` table has an INSERT policy that is too restrictive. During registration, this happens:

1. Supabase Auth successfully creates an auth user
2. The app tries to insert a profile row into the `users` table
3. **The INSERT RLS policy blocks this operation** ❌
4. Registration fails

The issue is that the current INSERT policy requires `auth.uid() = id`, but the policy isn't properly configured to allow the authenticated user to insert their own row.

## The Fix

The fix migration already exists in your codebase:
- **File**: `supabase/migrations/20251107005107_fix_user_registration_rls_policy.sql`

This migration:
1. Drops the restrictive INSERT policy
2. Creates a new policy that allows authenticated users to insert their own profile
3. Uses `WITH CHECK (id = auth.uid())` to ensure users can only create their own profile

## How to Apply the Fix

### Option 1: Using Supabase SQL Editor (Recommended)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**
5. Open the file `FIX_REGISTRATION.sql` from this repository
6. Copy the entire contents
7. Paste into the SQL Editor
8. Click **"Run"** (or press Cmd/Ctrl + Enter)
9. Verify you see **"Success. No rows returned"**

### Option 2: Using the Original Migration File

If you prefer, you can also use the original migration file:

1. Open: `supabase/migrations/20251107005107_fix_user_registration_rls_policy.sql`
2. Copy its contents
3. Run it in the Supabase SQL Editor (same steps as above)

Both files contain the same fix.

## Verification

After applying the fix:

1. Open your app in an **incognito/private browser window** (to ensure clean session)
2. Navigate to the registration page
3. Try to create a new account with:
   - Valid email address
   - Password (6+ characters)
   - Your name
4. Registration should now work ✅
5. You should see a message about pending approval
6. The new user will appear in **Admin Panel > Approvals** tab

## Understanding the Security Model

After this fix, here's how the user registration security works:

### During Registration:
- Supabase Auth creates the authenticated user
- The user can insert ONE row into the `users` table
- The inserted row MUST have `id = auth.uid()` (their own ID)
- No one can insert rows for other users

### For User Profile Updates:
- Regular users can only update their own non-sensitive fields (name, bio, avatar)
- Regular users CANNOT change their `role` or `approval_status`
- Only admins can update sensitive fields like `role` and `approval_status`
- This is enforced by the secure RLS policies from migration `20251107000000_secure_approval_and_role_fields.sql`

## Related Migrations

These migrations work together to secure your user system:

1. **20251106000000_add_member_approval.sql**
   - Adds the `approval_status` field
   - Defaults existing users to 'approved'

2. **20251107000000_secure_approval_and_role_fields.sql**
   - Prevents users from self-approving
   - Prevents users from promoting themselves to admin
   - Implements field-level security

3. **20251107005107_fix_user_registration_rls_policy.sql** ← **YOU ARE HERE**
   - Fixes the INSERT policy to allow registration
   - Ensures new users can create their profiles

## Troubleshooting

### Issue: Still can't register after applying fix

**Check 1: Verify the policy was created**
Run this query in SQL Editor:
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'INSERT';
```

You should see a policy named `"Users can insert own profile"` with:
- `cmd`: `INSERT`
- `with_check`: `(id = auth.uid())`

**Check 2: Check for banned email**
Your app checks for banned emails during registration. Verify the email isn't banned:
```sql
SELECT * FROM banned_emails WHERE email = 'test@example.com';
```

**Check 3: Check browser console**
Open browser DevTools (F12) and check the Console tab for error messages during registration.

### Issue: Error message "Missing Supabase environment variables"

Make sure your `.env` file has:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Issue: Users can register but can't log in

This is expected behavior! New users have `approval_status = 'pending'` and must be approved by an admin:

1. Log in as an admin
2. Go to **Admin Panel** (Shield icon in navigation)
3. Click **"Approvals"** tab
4. Select the pending users
5. Click **"Approve Selected"**

After approval, users can log in normally.

## Need More Help?

If you're still experiencing issues:

1. Check the Supabase Dashboard > Logs for detailed error messages
2. Verify all related migrations have been applied
3. Ensure your Supabase project is on a recent version
4. Check that RLS is enabled on the `users` table

## Summary

✅ Apply `FIX_REGISTRATION.sql` via Supabase SQL Editor
✅ Test registration in incognito window
✅ Verify new users appear in Admin > Approvals
✅ Approve pending users to let them access the platform

Your registration system will now work securely with admin approval workflow!
