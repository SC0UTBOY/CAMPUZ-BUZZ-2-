-- Sync likes from legacy 'likes' table to new 'post_reactions' table
-- This ensures consistency between the two tables

-- Insert likes from 'likes' table into 'post_reactions' table as 'like' reactions
-- Only insert if they don't already exist
INSERT INTO post_reactions (post_id, user_id, reaction_type, created_at)
SELECT 
    l.post_id,
    l.user_id,
    'like' as reaction_type,
    l.created_at
FROM likes l
WHERE NOT EXISTS (
    SELECT 1 FROM post_reactions pr 
    WHERE pr.post_id = l.post_id 
    AND pr.user_id = l.user_id 
    AND pr.reaction_type = 'like'
);

-- Create function to sync likes and post_reactions tables
CREATE OR REPLACE FUNCTION sync_likes_to_reactions()
RETURNS TRIGGER AS $$
BEGIN
    -- If inserting into likes table, also insert into post_reactions
    IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'likes' THEN
        INSERT INTO post_reactions (post_id, user_id, reaction_type, created_at)
        VALUES (NEW.post_id, NEW.user_id, 'like', NEW.created_at)
        ON CONFLICT (post_id, user_id, reaction_type) DO NOTHING;
        RETURN NEW;
    END IF;
    
    -- If deleting from likes table, also delete from post_reactions
    IF TG_OP = 'DELETE' AND TG_TABLE_NAME = 'likes' THEN
        DELETE FROM post_reactions 
        WHERE post_id = OLD.post_id 
        AND user_id = OLD.user_id 
        AND reaction_type = 'like';
        RETURN OLD;
    END IF;
    
    -- If inserting into post_reactions with 'like' type, also insert into likes
    IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'post_reactions' AND NEW.reaction_type = 'like' THEN
        INSERT INTO likes (post_id, user_id, created_at)
        VALUES (NEW.post_id, NEW.user_id, NEW.created_at)
        ON CONFLICT (user_id, post_id) DO NOTHING;
        RETURN NEW;
    END IF;
    
    -- If deleting from post_reactions with 'like' type, also delete from likes
    IF TG_OP = 'DELETE' AND TG_TABLE_NAME = 'post_reactions' AND OLD.reaction_type = 'like' THEN
        DELETE FROM likes 
        WHERE post_id = OLD.post_id 
        AND user_id = OLD.user_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for bidirectional sync
DROP TRIGGER IF EXISTS sync_likes_insert ON likes;
CREATE TRIGGER sync_likes_insert
    AFTER INSERT ON likes
    FOR EACH ROW
    EXECUTE FUNCTION sync_likes_to_reactions();

DROP TRIGGER IF EXISTS sync_likes_delete ON likes;
CREATE TRIGGER sync_likes_delete
    AFTER DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION sync_likes_to_reactions();

DROP TRIGGER IF EXISTS sync_reactions_insert ON post_reactions;
CREATE TRIGGER sync_reactions_insert
    AFTER INSERT ON post_reactions
    FOR EACH ROW
    EXECUTE FUNCTION sync_likes_to_reactions();

DROP TRIGGER IF EXISTS sync_reactions_delete ON post_reactions;
CREATE TRIGGER sync_reactions_delete
    AFTER DELETE ON post_reactions
    FOR EACH ROW
    EXECUTE FUNCTION sync_likes_to_reactions();