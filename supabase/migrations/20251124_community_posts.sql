-- Migration: Add community_posts table with image upload support
-- Date: 2025-11-24

-- 1) Create community_posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caption text,
  image_url text,
  image_path text,
  post_type text NOT NULL DEFAULT 'image',
  reactions jsonb DEFAULT '{}'::jsonb,
  comments_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_community_posts_community_id ON public.community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);

-- 3) Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- 4) RLS Policies

-- Allow authenticated users to select all posts
DROP POLICY IF EXISTS "Select community posts" ON public.community_posts;
CREATE POLICY "Select community posts" ON public.community_posts
FOR SELECT
TO authenticated
USING (true);

-- Insert only if user is a member of community
DROP POLICY IF EXISTS "Insert community posts if member" ON public.community_posts;
CREATE POLICY "Insert community posts if member" ON public.community_posts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.community_members cm
    WHERE cm.community_id = community_posts.community_id
      AND cm.user_id = auth.uid()
      AND (cm.banned IS DISTINCT FROM true)
  )
);

-- Allow owners to update/delete their own posts
DROP POLICY IF EXISTS "Owners can update/delete posts" ON public.community_posts;
CREATE POLICY "Owners can update/delete posts" ON public.community_posts
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5) Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_community_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_community_posts_updated_at_trigger ON public.community_posts;
CREATE TRIGGER update_community_posts_updated_at_trigger
    BEFORE UPDATE ON public.community_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_community_posts_updated_at();

-- 6) Create storage buckets for community posts and images (this is idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('community-posts', 'community-posts', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']),
  ('community-images', 'community-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 7) Storage policies for community-posts bucket
-- Allow authenticated users to upload to community-posts
DROP POLICY IF EXISTS "Allow authenticated uploads to community-posts" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to community-posts" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-posts');

-- Allow authenticated users to upload to community-images
DROP POLICY IF EXISTS "Allow authenticated uploads to community-images" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to community-images" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-images');

-- Allow public to view community-posts
DROP POLICY IF EXISTS "Allow public to view community-posts" ON storage.objects;
CREATE POLICY "Allow public to view community-posts" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'community-posts');

-- Allow public to view community-images
DROP POLICY IF EXISTS "Allow public to view community-images" ON storage.objects;
CREATE POLICY "Allow public to view community-images" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'community-images');

-- Allow users to delete their own uploads from community-posts
DROP POLICY IF EXISTS "Allow users to delete own community-posts" ON storage.objects;
CREATE POLICY "Allow users to delete own community-posts" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'community-posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own uploads from community-images
DROP POLICY IF EXISTS "Allow users to delete own community-images" ON storage.objects;
CREATE POLICY "Allow users to delete own community-images" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[1]);

COMMENT ON TABLE public.community_posts IS 'Posts (images) created by community members';

