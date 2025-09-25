-- Fix likes table constraint and ensure proper structure

-- Drop existing constraint if it exists with wrong name
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_user_id_post_id_key;
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_post_id_user_id_key;

-- Ensure likes table has proper structure
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.likes 
DROP CONSTRAINT IF EXISTS likes_post_id_fkey;

ALTER TABLE public.likes 
ADD CONSTRAINT likes_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.likes 
DROP CONSTRAINT IF EXISTS likes_user_id_fkey;

ALTER TABLE public.likes 
ADD CONSTRAINT likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add unique constraint with correct name
ALTER TABLE public.likes 
DROP CONSTRAINT IF EXISTS likes_post_user_unique;

ALTER TABLE public.likes 
ADD CONSTRAINT likes_post_user_unique 
UNIQUE (post_id, user_id);

-- Enable RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all likes" ON public.likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.likes;

-- Create RLS policies
CREATE POLICY "Users can view all likes" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON public.likes
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_user ON public.likes(post_id, user_id);

-- Clean up any duplicate likes that might exist
DELETE FROM public.likes a USING public.likes b 
WHERE a.id < b.id 
AND a.post_id = b.post_id 
AND a.user_id = b.user_id;
