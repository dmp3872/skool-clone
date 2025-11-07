# Supabase Video Storage Setup Guide

This guide will help you set up Supabase Storage for self-hosting video content in your Skool clone.

## Prerequisites

- Supabase project created
- Database migrations applied
- Admin access to Supabase dashboard

## Step 1: Create the Videos Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/storage/buckets

2. Click **"Create a new bucket"**

3. Configure the bucket:
   - **Bucket name**: `videos`
   - **Public bucket**: **NO** (keep it private for access control)
   - **File size limit**: 500 MB (or adjust as needed)
   - **Allowed MIME types**: Leave empty or add:
     - `video/mp4`
     - `video/webm`
     - `video/ogg`
     - `video/quicktime`

4. Click **"Create bucket"**

## Step 2: Apply Database Migration

The migration file `20251107000002_setup_video_storage.sql` will:
- Create RLS policies for the videos bucket
- Add `video_storage_path` and `video_type` columns to lessons table
- Set up proper admin-only upload permissions

Run the migration:
```bash
# If using Supabase CLI
supabase db push

# Or apply manually in SQL Editor
# Copy contents of supabase/migrations/20251107000002_setup_video_storage.sql
# Paste into Supabase Dashboard → SQL Editor → Run
```

## Step 3: Verify Setup

### Check Bucket Policies

Go to: Storage → Policies

You should see these policies for the `videos` bucket:
- ✅ **Authenticated users can view videos** (SELECT)
- ✅ **Admins can upload videos** (INSERT)
- ✅ **Admins can delete videos** (DELETE)
- ✅ **Admins can update videos** (UPDATE)

### Check Database Schema

Run this SQL query to verify:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'lessons'
AND column_name IN ('video_storage_path', 'video_type');
```

You should see both columns listed.

## Step 4: Test Video Upload

1. Log in as an admin user
2. Go to **Admin Dashboard → Courses**
3. Create or edit a lesson
4. Click the **"Upload Video"** tab
5. Upload a test video file (MP4 recommended)
6. Save the lesson
7. View the lesson to verify video playback

## How It Works

### Video Types

The system supports two video types:

1. **External URL** (`video_type: 'url'`)
   - YouTube embeds
   - Vimeo embeds
   - Other external video URLs
   - Stored in: `video_url` column

2. **Uploaded Video** (`video_type: 'upload'`)
   - Self-hosted in Supabase Storage
   - Stored in: `video_storage_path` column
   - Format: `courses/{courseId}/lessons/{lessonId}_{timestamp}.{ext}`

### Security

- **Videos are private** - require authentication to view
- **Signed URLs** - Videos accessed via time-limited signed URLs (1 hour expiry)
- **Admin-only uploads** - Only admins/moderators can upload videos
- **RLS protection** - Row Level Security enforces access control

### File Limits

- **Maximum file size**: 500MB per video
- **Supported formats**: MP4, WebM, OGG, QuickTime
- **Recommended**: MP4 (H.264 video, AAC audio) at 1080p or 720p

## Storage Costs

Supabase Storage Pricing (as of 2024):
- **Storage**: $0.021/GB/month
- **Bandwidth**: $0.09/GB downloaded

**Example Costs:**
- 100GB videos + 1TB bandwidth/month = ~$25/month
- 1TB videos + 10TB bandwidth/month = ~$250/month

## Optimization Tips

### 1. Compress Videos Before Upload

Use tools like:
- **HandBrake** (free, cross-platform)
- **FFmpeg** (command line)

Recommended settings:
```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k output.mp4
```

### 2. Use Appropriate Resolutions

- **Short lessons (<10 min)**: 720p
- **Long lessons (>10 min)**: 720p or lower
- **Screencasts**: 1080p max

### 3. Monitor Storage Usage

Check usage: Supabase Dashboard → Settings → Usage

Set up alerts for:
- Storage approaching limits
- Bandwidth usage spikes
- File upload errors

## Troubleshooting

### Video Upload Fails

**Error: "Failed to upload video"**
- Check file size (<500MB)
- Verify file format (MP4, WebM, OGG, MOV)
- Check Supabase Storage quotas

**Error: "Permission denied"**
- Verify you're logged in as admin
- Check RLS policies are applied
- Ensure `is_admin()` function exists

### Video Won't Play

**Error: "Failed to load video"**
- Check `video_storage_path` is correct in database
- Verify signed URL is generated (`getVideoUrl` function)
- Check browser console for errors
- Try refreshing page (signed URLs expire after 1 hour)

**Video loads slowly**
- Large file size - compress video
- Network issues - check connection
- Supabase region far from user - consider CDN

### Migration Fails

**Error: "function is_admin() does not exist"**
- Run the previous migration: `20251107000000_secure_approval_and_role_fields.sql`
- This creates the `is_admin()` helper function

## Upgrading to Cloudflare Stream (Future)

When ready to scale, you can migrate to Cloudflare Stream:

1. Keep existing data structure
2. Add `cloudflare_video_id` column
3. Upload videos to Cloudflare
4. Update player component
5. Migrate existing videos gradually

Migration is straightforward since video handling is abstracted through the storage helper functions.

## Support

For issues:
1. Check Supabase Storage logs
2. Verify RLS policies
3. Test with different video files
4. Check browser console errors

For Supabase support: https://supabase.com/docs/guides/storage
