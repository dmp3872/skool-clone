# Troubleshooting: Post Creation Error

## The Problem

You're getting an error when trying to create a post. This is most likely caused by the database not having the latest schema changes.

## Quick Fix (5 minutes)

### Step 1: Apply Database Migration

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Fix**
   - Open the file: `QUICK_FIX_DATABASE.sql` in this repository
   - Copy the ENTIRE contents
   - Paste into the SQL Editor
   - Click **"Run"** (or press Cmd/Ctrl + Enter)

4. **Verify Success**
   - You should see: ✅ Success messages
   - Look for: "Added company_id column to posts table"

### Step 2: Test Post Creation

1. Refresh your app (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
2. Try creating a post again
3. Should work now! ✅

---

## What Was the Issue?

The recent "Company Discussion Boards" feature added a new `company_id` column to the posts table. This column needs to exist in your database for posts to be created.

The error happens because:
- The code tries to insert `company_id` into the database
- The column doesn't exist yet
- Database returns an error
- Post creation fails

---

## Alternative: Manual SQL Command

If you prefer to run just the essential command:

```sql
-- Add company_id column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS company_id TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_posts_company_id ON posts(company_id);
```

---

## Still Having Issues?

### Check Browser Console

1. Open browser DevTools (F12 or Right-click → Inspect)
2. Go to "Console" tab
3. Try creating a post again
4. Look for error messages
5. Share the exact error message for more specific help

### Common Error Messages

**"column 'company_id' does not exist"**
- Solution: Run the QUICK_FIX_DATABASE.sql file

**"violates row level security policy"**
- Solution: Check that you're logged in as an approved user
- Check that the RLS policies are properly set up (run the auth fix migration)

**"Failed to create user profile"**
- Solution: This is from registration, not posting
- Run the auth fix migration from AUTH_FIX_README.md

**"CORS error" or "Network error"**
- Solution: Check your Supabase URL and API keys in .env file
- Verify project is running and not paused

---

## Prevention

To avoid this in the future, whenever you pull new code:

1. Check the `supabase/migrations/` folder for new .sql files
2. Run any new migrations in your Supabase SQL Editor
3. Or run the QUICK_FIX_DATABASE.sql file which includes all recent changes

---

## What This Migration Does

The migration adds support for company-specific posts:

- **company_id** (TEXT, nullable): Links a post to a specific peptide supplier
- **Index**: Makes company-based queries fast
- **Optional**: Posts can be general (null) or company-specific

This enables the company discussion boards feature where each supplier has its own discussion page.

---

## Need More Help?

If you're still stuck:

1. Share the exact error message from browser console
2. Check if the column was added: Run this query in Supabase SQL Editor:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'posts';
   ```
3. Verify you see `company_id` in the results

The fix is simple - just needs the database migration applied! 🚀
