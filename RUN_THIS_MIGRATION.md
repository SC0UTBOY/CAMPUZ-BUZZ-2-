# 🚀 Quick Start: Apply Community Posts Migration

## Step 1: Copy the SQL

Copy the entire contents of:
```
supabase/migrations/20251124_community_posts.sql
```

## Step 2: Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**

## Step 3: Paste & Execute

1. Paste the SQL migration
2. Click **Run** (or press Ctrl+Enter)
3. Wait for "Success" message

## Step 4: Verify

Run these verification queries:

```sql
-- Check table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'community_posts';
-- Should return: community_posts

-- Check bucket exists
SELECT id, name, public FROM storage.buckets 
WHERE id = 'community-posts';
-- Should return: community-posts | community-posts | true

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'community_posts';
-- Should return: community_posts | true

-- Check policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'community_posts';
-- Should return multiple policy names
```

## Step 5: Test in App

1. Open your app
2. Go to Communities page (`/communities`)
3. Click "Join" on any community
4. Should auto-navigate to community page
5. Click "Create Post"
6. Upload an image
7. Post should appear immediately

## ✅ Success Indicators

- [x] Table `community_posts` exists
- [x] Storage bucket `community-posts` exists
- [x] RLS is enabled
- [x] Policies are created
- [x] Can join community without errors
- [x] Can create image posts
- [x] Posts appear in real-time

## 🐛 Troubleshooting

### Error: "relation community_posts does not exist"
→ Migration didn't run. Re-run the SQL.

### Error: "bucket community-posts does not exist"
→ Manually create bucket in Storage section, set to Public.

### Error: "permission denied for table community_posts"
→ RLS policies not created. Check SQL Editor for errors.

### Error: "duplicate key value violates unique constraint"
→ This should NOT happen anymore. If it does, check `joinCommunity()` logic.

### Posts don't appear after upload
→ Check browser console for errors. Verify storage bucket is public.

---

**Quick Check:**
```sql
-- This should return true if everything is set up:
SELECT 
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'community_posts') = 1 AS table_exists,
  (SELECT COUNT(*) FROM storage.buckets WHERE id = 'community-posts') = 1 AS bucket_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'community_posts') >= 3 AS policies_exist;
```

If all three return `true`, you're good to go! ✅

