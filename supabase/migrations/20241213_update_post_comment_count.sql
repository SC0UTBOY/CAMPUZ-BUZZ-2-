-- Create function to update post comment count
CREATE OR REPLACE FUNCTION update_post_comment_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts 
  SET comments_count = (
    SELECT COUNT(*) 
    FROM comments 
    WHERE comments.post_id = update_post_comment_count.post_id
  )
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Create index for better performance on comment queries
CREATE INDEX IF NOT EXISTS idx_comments_post_user ON comments(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- Add trigger to automatically update comment count when comments are added/removed
CREATE OR REPLACE FUNCTION trigger_update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET comments_count = GREATEST(comments_count - 1, 0) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_post_comment_count_trigger ON comments;
CREATE TRIGGER update_post_comment_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_post_comment_count();

-- Update existing posts with correct comment counts
UPDATE posts 
SET comments_count = (
  SELECT COUNT(*) 
  FROM comments 
  WHERE comments.post_id = posts.id
);









