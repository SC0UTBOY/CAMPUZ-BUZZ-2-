-- Fix the duplicate likes constraint issue

-- First, remove any duplicate likes that might exist
DELETE FROM public.likes a USING public.likes b 
WHERE a.id < b.id 
AND a.post_id = b.post_id 
AND a.user_id = b.user_id;

-- Drop the existing constraint with the problematic name
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_user_id_post_id_key;

-- Drop any other unique constraints that might exist
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_post_user_unique;
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_unique_user_post;

-- Add a new constraint with a clear name
ALTER TABLE public.likes 
ADD CONSTRAINT likes_post_user_unique 
UNIQUE (post_id, user_id);

-- Ensure the table has proper structure
ALTER TABLE public.likes 
ALTER COLUMN post_id SET NOT NULL;

ALTER TABLE public.likes 
ALTER COLUMN user_id SET NOT NULL;

-- Ensure RLS is enabled
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Update policies
DROP POLICY IF EXISTS "Users can view all likes" ON public.likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.likes;
DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;
DROP POLICY IF EXISTS "Users can manage own likes" ON public.likes;

-- Create simple, working policies
CREATE POLICY "Anyone can view likes" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own likes" ON public.likes
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_user ON public.likes(post_id, user_id);
