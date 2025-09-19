-- Fix Likes System Migration
-- Run this in Supabase SQL Editor

-- 1. Ensure likes table exists with proper structure
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid,
  comment_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT likes_pkey PRIMARY KEY (id),
  CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
  CONSTRAINT likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE,
  -- Ensure either post_id OR comment_id is set, not both
  CONSTRAINT likes_post_or_comment_check CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL)),
  -- Prevent duplicate likes
  CONSTRAINT likes_user_post_unique UNIQUE (user_id, post_id),
  CONSTRAINT likes_user_comment_unique UNIQUE (user_id, comment_id)
);

-- 2. Enable RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all likes" ON public.likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes;

-- 4. Create proper RLS policies
CREATE POLICY "Users can view all likes" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON public.likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

-- 6. Create function to update post like counts (optional but recommended)
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET likes_count = (
      SELECT COUNT(*) FROM public.likes WHERE post_id = NEW.post_id
    )
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET likes_count = (
      SELECT COUNT(*) FROM public.likes WHERE post_id = OLD.post_id
    )
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to automatically update like counts
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON public.likes;
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- Success message
SELECT 'Likes system fixed successfully! 🎉' as status;
