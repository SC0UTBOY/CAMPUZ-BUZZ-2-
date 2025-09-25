-- Ensure posts table has all required columns for the create post functionality

-- Add missing columns if they don't exist
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS post_type VARCHAR(20) DEFAULT 'text';

ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public';

ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}';

ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS mentions TEXT[] DEFAULT '{}';

ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS community_id UUID;

-- Ensure the posts table has proper constraints
ALTER TABLE public.posts 
ALTER COLUMN content SET NOT NULL;

ALTER TABLE public.posts 
ALTER COLUMN user_id SET NOT NULL;

-- Add check constraints for valid values
ALTER TABLE public.posts 
DROP CONSTRAINT IF EXISTS posts_post_type_check;

ALTER TABLE public.posts 
ADD CONSTRAINT posts_post_type_check 
CHECK (post_type IN ('text', 'image', 'video', 'poll'));

ALTER TABLE public.posts 
DROP CONSTRAINT IF EXISTS posts_visibility_check;

ALTER TABLE public.posts 
ADD CONSTRAINT posts_visibility_check 
CHECK (visibility IN ('public', 'friends', 'private'));

-- Ensure RLS is enabled
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Update policies to allow users to create posts
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;

CREATE POLICY "Users can create their own posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure users can view public posts
DROP POLICY IF EXISTS "Anyone can view public posts" ON public.posts;

CREATE POLICY "Anyone can view public posts" ON public.posts
  FOR SELECT USING (visibility = 'public' OR auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON public.posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON public.posts(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON public.posts USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING GIN(tags);
