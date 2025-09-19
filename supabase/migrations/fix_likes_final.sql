-- FINAL LIKES SYSTEM FIX
-- Run this in Supabase SQL Editor

-- 1. Drop existing likes table if it has issues
DROP TABLE IF EXISTS public.post_likes CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;

-- 2. Create proper likes table
CREATE TABLE public.likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT likes_pkey PRIMARY KEY (id),
  CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
  -- UNIQUE CONSTRAINT - prevents duplicate likes
  CONSTRAINT likes_user_post_unique UNIQUE (user_id, post_id)
);

-- 3. Enable RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view all likes" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Ensure posts table has likes_count column
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;

-- 6. Create function to update like counts automatically
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

-- 7. Create trigger
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON public.likes;
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON public.likes(user_id, post_id);

-- 9. Update existing posts like counts
UPDATE public.posts 
SET likes_count = (
  SELECT COUNT(*) FROM public.likes WHERE post_id = posts.id
);

SELECT 'Likes system fixed successfully! 🎉' as status;
