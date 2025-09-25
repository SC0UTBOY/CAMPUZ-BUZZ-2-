-- Fix security issue: Set search_path for the sync function
CREATE OR REPLACE FUNCTION sync_likes_to_reactions()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
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