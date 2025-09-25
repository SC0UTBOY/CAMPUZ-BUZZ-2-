-- Storage Bucket and RLS Policies Setup
-- Run this in Supabase SQL Editor

-- 1. Create the post-images bucket (if dashboard method didn't work)
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

-- 2. Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- 3. Policy: Only authenticated users can upload images to their own folder
CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-images' AND 
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. Policy: Anyone can view images (public access)
CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-images');

-- 5. Policy: Users can delete their own images
CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'post-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 6. Verify bucket creation
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'post-images';

-- 7. Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%images%';

SELECT 'Storage bucket and policies created successfully! 🎉' as status;
