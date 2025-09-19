-- Fix Duplicate Likes Bug
-- Run this in Supabase SQL Editor

-- 1. First, remove any duplicate likes that might already exist
DELETE FROM public.post_likes a USING (
  SELECT MIN(ctid) as ctid, user_id, post_id
  FROM public.post_likes 
  GROUP BY user_id, post_id HAVING COUNT(*) > 1
) b
WHERE a.user_id = b.user_id 
  AND a.post_id = b.post_id 
  AND a.ctid <> b.ctid;

-- 2. Add UNIQUE constraint to prevent duplicate likes
ALTER TABLE public.post_likes 
ADD CONSTRAINT post_likes_user_post_unique 
UNIQUE (user_id, post_id);

-- 3. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_post_likes_user_post 
ON public.post_likes(user_id, post_id);

-- 4. Ensure posts table has likes_count column
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;

-- 5. Update existing like counts to be accurate
UPDATE public.posts 
SET likes_count = (
  SELECT COUNT(*) 
  FROM public.post_likes 
  WHERE post_id = posts.id
);

-- 6. Create function to automatically update like counts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to auto-update like counts
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON public.post_likes;
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

SELECT 'Duplicate likes bug fixed! ✅' as status;
