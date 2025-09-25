-- Fix Photo Posts Functionality
-- Run this in Supabase SQL Editor

-- 1. Ensure posts table has correct structure for images
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS file_name text;

-- 2. Create post-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up RLS policies for post-images bucket
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

CREATE POLICY "Users can upload their own images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view all images" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-images');

CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'post-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. Create function to clean up orphaned images
CREATE OR REPLACE FUNCTION cleanup_orphaned_images()
RETURNS void AS $$
BEGIN
  -- Delete images that don't have corresponding posts
  DELETE FROM storage.objects 
  WHERE bucket_id = 'post-images' 
  AND NOT EXISTS (
    SELECT 1 FROM public.posts 
    WHERE posts.image_url LIKE '%' || objects.name || '%'
  )
  AND created_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- 5. Update posts table to handle image posts better
UPDATE public.posts 
SET post_type = 'image' 
WHERE image_url IS NOT NULL 
AND post_type = 'text';

-- 6. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_posts_image_url ON public.posts(image_url) WHERE image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_type ON public.posts(post_type);

-- 7. Ensure proper constraints
ALTER TABLE public.posts 
ADD CONSTRAINT posts_type_check 
CHECK (post_type IN ('text', 'image', 'video', 'poll', 'event'));

SELECT 'Photo posts functionality fixed! 📸' as status;
