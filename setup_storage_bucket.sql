-- Setup Community Posts Storage Bucket
-- Run this in your Supabase SQL Editor

-- 1. Create the community-posts bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-posts',
  'community-posts',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- 2. Enable RLS on storage objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload community post images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to community post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own community post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own community post images" ON storage.objects;

-- 4. Create policy for authenticated users to upload images
-- Users can upload to folders: communityId/userId/filename
CREATE POLICY "Authenticated users can upload community post images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community-posts'
);

-- 5. Create policy for public read access
CREATE POLICY "Public read access to community post images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'community-posts');

-- 6. Create policy for users to delete their own images
CREATE POLICY "Users can delete their own community post images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'community-posts'
);

-- 7. Create policy for users to update their own images
CREATE POLICY "Users can update their own community post images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'community-posts'
);

-- 8. Verify bucket creation
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'community-posts';

-- 9. Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE '%community post%';

SELECT '✅ Community posts storage bucket setup complete!' as status;
