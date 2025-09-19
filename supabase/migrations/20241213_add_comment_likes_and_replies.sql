-- Add comment likes and replies functionality
-- This migration creates tables for comment likes and replies

-- 1. Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id) -- Prevent duplicate likes
);

-- 2. Create replies table
CREATE TABLE IF NOT EXISTS replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL CHECK (length(trim(text)) > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_replies_comment_id ON replies(comment_id);
CREATE INDEX IF NOT EXISTS idx_replies_user_id ON replies(user_id);
CREATE INDEX IF NOT EXISTS idx_replies_created_at ON replies(created_at);

-- 4. Add like_count and reply_count columns to comments table
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- 5. Create function to update comment like count
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE comments 
        SET like_count = like_count + 1 
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE comments 
        SET like_count = GREATEST(like_count - 1, 0) 
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to update comment reply count
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE comments 
        SET reply_count = reply_count + 1 
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE comments 
        SET reply_count = GREATEST(reply_count - 1, 0) 
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Create triggers for like count updates
DROP TRIGGER IF EXISTS trigger_update_comment_like_count ON comment_likes;
CREATE TRIGGER trigger_update_comment_like_count
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();

-- 8. Create triggers for reply count updates
DROP TRIGGER IF EXISTS trigger_update_comment_reply_count ON replies;
CREATE TRIGGER trigger_update_comment_reply_count
    AFTER INSERT OR DELETE ON replies
    FOR EACH ROW EXECUTE FUNCTION update_comment_reply_count();

-- 9. Create function to update existing comment counts
CREATE OR REPLACE FUNCTION update_existing_comment_counts()
RETURNS void AS $$
BEGIN
    -- Update like counts for existing comments
    UPDATE comments 
    SET like_count = (
        SELECT COUNT(*) 
        FROM comment_likes 
        WHERE comment_likes.comment_id = comments.id
    );
    
    -- Update reply counts for existing comments
    UPDATE comments 
    SET reply_count = (
        SELECT COUNT(*) 
        FROM replies 
        WHERE replies.comment_id = comments.id
    );
END;
$$ LANGUAGE plpgsql;

-- 10. Run the function to update existing counts
SELECT update_existing_comment_counts();

-- 11. Set up RLS policies for comment_likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all comment likes" ON comment_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like comments" ON comment_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" ON comment_likes
    FOR DELETE USING (auth.uid() = user_id);

-- 12. Set up RLS policies for replies
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all replies" ON replies
    FOR SELECT USING (true);

CREATE POLICY "Users can create replies" ON replies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own replies" ON replies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies" ON replies
    FOR DELETE USING (auth.uid() = user_id);

-- 13. Refresh schema cache
ANALYZE comment_likes;
ANALYZE replies;
ANALYZE comments;









