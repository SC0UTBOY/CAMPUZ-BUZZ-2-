-- ============================================
-- SUPABASE STORAGE SETUP - COPY AND RUN THIS
-- ============================================
-- Go to: https://supabase.com/dashboard/project/seqxzvkodvrqvrvekygy/sql
-- Click "New Query" → Paste this entire script → Click "Run"

-- Create the post-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Enable Row Level Security
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete own" ON storage.objects;

-- Policy 1: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-images');

-- Policy 2: Allow public read access
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'post-images');

-- Policy 3: Allow users to delete their own images
CREATE POLICY "Allow delete own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify setup
SELECT 
  '✅ Storage bucket created successfully!' as message,
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets 
WHERE id = 'post-images';

-- Check policies
SELECT 
  '✅ Policies created:' as message,
  policyname
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
  AND policyname IN ('Allow authenticated uploads', 'Allow public reads', 'Allow delete own');

SELECT '🎉 Setup complete! Refresh your app and try uploading an image.' as final_message;
