-- Fix Storage RLS Issues
-- Run this as admin in Supabase SQL Editor

-- 1. Temporarily disable RLS on storage.buckets to create bucket
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- 2. Create the post-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Re-enable RLS on storage.buckets
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for storage.objects (not buckets)
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- Policy for uploading images
CREATE POLICY "Users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-images' AND 
    auth.role() = 'authenticated'
  );

-- Policy for viewing images (public bucket)
CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-images');

-- Policy for deleting own images
CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'post-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5. Verify bucket was created
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'post-images';

SELECT 'Storage bucket created with fixed RLS policies! 🎉' as status;
