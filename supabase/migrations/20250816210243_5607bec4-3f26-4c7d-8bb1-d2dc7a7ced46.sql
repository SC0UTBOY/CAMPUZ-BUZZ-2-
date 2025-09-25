-- Create a function to update likes count
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment likes count
    UPDATE public.posts 
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement likes count
    UPDATE public.posts 
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update likes count
CREATE TRIGGER update_post_likes_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_likes_count();