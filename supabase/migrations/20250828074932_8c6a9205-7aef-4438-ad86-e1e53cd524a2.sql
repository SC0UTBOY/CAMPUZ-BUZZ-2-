
-- Add missing columns to comments table for better threading
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_comments_updated_at_trigger ON public.comments;
CREATE TRIGGER update_comments_updated_at_trigger
    BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION update_comments_updated_at();

-- Add index for better performance on post comments queries
CREATE INDEX IF NOT EXISTS idx_comments_post_id_created_at ON public.comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id) WHERE parent_id IS NOT NULL;

-- Update comments count trigger to be more robust
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Only count top-level comments (not replies) for the main count
    IF NEW.parent_id IS NULL THEN
      UPDATE public.posts 
      SET comments_count = comments_count + 1
      WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Only decrease count for top-level comments
    IF OLD.parent_id IS NULL THEN
      UPDATE public.posts 
      SET comments_count = GREATEST(0, comments_count - 1)
      WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger and create new one
DROP TRIGGER IF EXISTS comments_count_trigger ON public.comments;
CREATE TRIGGER comments_count_trigger
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_comments_count();

-- Add RLS policy for comment deletion
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments" 
  ON public.comments 
  FOR DELETE 
  USING (auth.uid() = user_id);
