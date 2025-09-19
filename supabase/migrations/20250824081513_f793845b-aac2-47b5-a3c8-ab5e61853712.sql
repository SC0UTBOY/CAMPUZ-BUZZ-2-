-- Create post_reactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL DEFAULT 'like',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Enable RLS on post_reactions
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for post_reactions
CREATE POLICY "Post reactions are viewable by authenticated users" 
  ON public.post_reactions 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can react to posts" 
  ON public.post_reactions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions" 
  ON public.post_reactions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add trigger to update post reaction counts
CREATE OR REPLACE FUNCTION public.update_post_reaction_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update post with new reaction count (simplified - just track likes for now)
    IF NEW.reaction_type = 'like' THEN
      UPDATE public.posts 
      SET likes_count = likes_count + 1
      WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement reaction count
    IF OLD.reaction_type = 'like' THEN
      UPDATE public.posts 
      SET likes_count = GREATEST(0, likes_count - 1)
      WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Create trigger for post reaction counts
DROP TRIGGER IF EXISTS trigger_update_post_reaction_counts ON public.post_reactions;
CREATE TRIGGER trigger_update_post_reaction_counts
  AFTER INSERT OR DELETE ON public.post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_reaction_counts();

-- Add enhanced post deletion policy for owners
CREATE POLICY "Post owners can delete their posts" 
  ON public.posts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to safely delete posts with all related data
CREATE OR REPLACE FUNCTION public.delete_post_cascade(post_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Check if the current user owns the post
  IF NOT EXISTS (
    SELECT 1 FROM public.posts 
    WHERE id = post_uuid AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: You can only delete your own posts';
  END IF;

  -- Delete all related data (cascading deletes should handle this, but being explicit)
  DELETE FROM public.likes WHERE post_id = post_uuid;
  DELETE FROM public.comments WHERE post_id = post_uuid;
  DELETE FROM public.post_reactions WHERE post_id = post_uuid;
  DELETE FROM public.post_saves WHERE post_id = post_uuid;
  DELETE FROM public.post_hashtags WHERE post_id = post_uuid;
  DELETE FROM public.post_mentions WHERE post_id = post_uuid;
  DELETE FROM public.post_reports WHERE post_id = post_uuid;
  
  -- Finally delete the post itself
  DELETE FROM public.posts WHERE id = post_uuid;
  
  RETURN true;
END;
$function$;