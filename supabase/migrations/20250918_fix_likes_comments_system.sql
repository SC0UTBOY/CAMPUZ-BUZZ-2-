-- Fix likes and comments system
-- This migration ensures all necessary functions and triggers exist

-- 1. Create or replace the update_post_like_count function
CREATE OR REPLACE FUNCTION update_post_like_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET likes_count = (
    SELECT COUNT(*) 
    FROM likes 
    WHERE likes.post_id = update_post_like_count.post_id
  )
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create or replace the update_post_comment_count function
CREATE OR REPLACE FUNCTION update_post_comment_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET comments_count = (
    SELECT COUNT(*) 
    FROM comments 
    WHERE comments.post_id = update_post_comment_count.post_id
  )
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger to automatically update like count
CREATE OR REPLACE FUNCTION trigger_update_post_like_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_post_like_count(NEW.post_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_post_like_count(OLD.post_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS likes_count_trigger ON likes;

-- Create the trigger
CREATE TRIGGER likes_count_trigger
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_post_like_count();

-- 4. Create trigger to automatically update comment count
CREATE OR REPLACE FUNCTION trigger_update_post_comment_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_post_comment_count(NEW.post_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_post_comment_count(OLD.post_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS comments_count_trigger ON comments;

-- Create the trigger
CREATE TRIGGER comments_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_post_comment_count();

-- 5. Ensure proper indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_likes_post_user ON likes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

-- 6. Fix any existing count discrepancies
UPDATE posts SET likes_count = (
  SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id
);

UPDATE posts SET comments_count = (
  SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id
);

-- 7. Ensure RLS policies are correct for likes
CREATE POLICY IF NOT EXISTS "Users can view all likes" ON likes
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can manage their own likes" ON likes
  FOR ALL USING (auth.uid() = user_id);

-- 8. Ensure RLS policies are correct for comments  
CREATE POLICY IF NOT EXISTS "Users can view all comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can manage their own comments" ON comments
  FOR ALL USING (auth.uid() = user_id);
