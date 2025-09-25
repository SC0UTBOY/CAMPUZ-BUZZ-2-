-- Apply comment likes and replies functionality
-- Run this in your Supabase SQL Editor

-- 1. Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
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

-- 3. Add indexes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_replies_comment_id ON replies(comment_id);
CREATE INDEX IF NOT EXISTS idx_replies_user_id ON replies(user_id);

-- 4. Add count columns to comments
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- 5. Create update functions
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE comments SET reply_count = reply_count + 1 WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE comments SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Create triggers
DROP TRIGGER IF EXISTS trigger_update_comment_like_count ON comment_likes;
CREATE TRIGGER trigger_update_comment_like_count
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();

DROP TRIGGER IF EXISTS trigger_update_comment_reply_count ON replies;
CREATE TRIGGER trigger_update_comment_reply_count
    AFTER INSERT OR DELETE ON replies
    FOR EACH ROW EXECUTE FUNCTION update_comment_reply_count();

-- 7. Set up RLS
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;

-- Comment likes policies
CREATE POLICY "Users can view all comment likes" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can like comments" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own likes" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Replies policies
CREATE POLICY "Users can view all replies" ON replies FOR SELECT USING (true);
CREATE POLICY "Users can create replies" ON replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own replies" ON replies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own replies" ON replies FOR DELETE USING (auth.uid() = user_id);

-- 8. Refresh schema
ANALYZE comment_likes;
ANALYZE replies;
ANALYZE comments;









