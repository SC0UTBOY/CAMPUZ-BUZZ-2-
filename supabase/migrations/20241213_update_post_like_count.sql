-- Create function to update post like count
CREATE OR REPLACE FUNCTION update_post_like_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts 
  SET likes_count = (
    SELECT COUNT(*) 
    FROM likes 
    WHERE likes.post_id = update_post_like_count.post_id
  )
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Create index for better performance on like queries
CREATE INDEX IF NOT EXISTS idx_likes_post_user ON likes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);

-- Add trigger to automatically update like count when likes are added/removed
CREATE OR REPLACE FUNCTION trigger_update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_post_like_count_trigger ON likes;
CREATE TRIGGER update_post_like_count_trigger
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_post_like_count();





















