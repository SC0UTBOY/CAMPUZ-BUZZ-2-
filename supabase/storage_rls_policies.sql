-- Storage RLS Policies for post-images bucket
-- Run this in Supabase SQL Editor AFTER creating the bucket

-- 1. Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;

-- 2. Policy: Only authenticated users can upload images to their own folder
CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-images' AND 
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3. Policy: Anyone can view/download images (public access)
CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-images');

-- 4. Policy: Users can delete their own images
CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'post-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5. Policy: Users can update their own images
CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'post-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 6. Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%images%';

SELECT 'RLS policies created successfully! 🔒' as status;
