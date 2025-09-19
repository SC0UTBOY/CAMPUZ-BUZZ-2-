-- Setup image storage for posts

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload images
CREATE POLICY IF NOT EXISTS "Users can upload post images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy to allow anyone to view post images
CREATE POLICY IF NOT EXISTS "Anyone can view post images" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-images');

-- Policy to allow users to delete their own images
CREATE POLICY IF NOT EXISTS "Users can delete their own post images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'post-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy to allow users to update their own images
CREATE POLICY IF NOT EXISTS "Users can update their own post images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'post-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Ensure posts table has image_url column
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index for posts with images
CREATE INDEX IF NOT EXISTS idx_posts_with_images ON public.posts(image_url) 
WHERE image_url IS NOT NULL;
