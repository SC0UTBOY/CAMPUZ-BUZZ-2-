-- Fix comments-profiles relationship and refresh schema cache
-- This migration ensures comments.user_id properly references profiles.id

-- Step 1: Drop existing foreign key constraints that might be incorrect
DO $$ 
BEGIN
    -- Drop existing foreign key constraints if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'comments_user_id_fkey' 
        AND table_name = 'comments'
    ) THEN
        ALTER TABLE comments DROP CONSTRAINT comments_user_id_fkey;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'posts_user_id_fkey' 
        AND table_name = 'posts'
    ) THEN
        ALTER TABLE posts DROP CONSTRAINT posts_user_id_fkey;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'likes_user_id_fkey' 
        AND table_name = 'likes'
    ) THEN
        ALTER TABLE likes DROP CONSTRAINT likes_user_id_fkey;
    END IF;
END $$;

-- Step 2: Ensure profiles table has proper structure
-- Make sure profiles.id is the primary key and user_id is unique
DO $$ 
BEGIN
    -- Add primary key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_pkey' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
    END IF;
    
    -- Ensure user_id is unique (should reference auth.users.id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_user_id_key' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Step 3: Add foreign key constraint between comments.user_id and profiles.id
-- This is the key fix - comments should reference profiles.id
ALTER TABLE comments 
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Step 4: Add foreign key constraint between posts.user_id and profiles.id
ALTER TABLE posts 
ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Step 5: Add foreign key constraint between likes.user_id and profiles.id
ALTER TABLE likes 
ADD CONSTRAINT likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Step 6: Ensure other foreign key relationships are correct
-- Comments should reference posts
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;
ALTER TABLE comments 
ADD CONSTRAINT comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES posts(id) 
ON DELETE CASCADE;

-- Posts should reference communities (if community_id exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'community_id'
    ) THEN
        ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_community_id_fkey;
        ALTER TABLE posts 
        ADD CONSTRAINT posts_community_id_fkey 
        FOREIGN KEY (community_id) REFERENCES communities(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Communities should reference profiles for created_by
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'communities' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE communities DROP CONSTRAINT IF EXISTS communities_created_by_fkey;
        ALTER TABLE communities 
        ADD CONSTRAINT communities_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES profiles(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Step 7: Add missing columns to comments table if they don't exist
DO $$ 
BEGIN
    -- Add parent_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'parent_id'
    ) THEN
        ALTER TABLE comments ADD COLUMN parent_id UUID;
    END IF;
    
    -- Add depth column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'depth'
    ) THEN
        ALTER TABLE comments ADD COLUMN depth INTEGER DEFAULT 0;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE comments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    
    -- Add reactions column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'reactions'
    ) THEN
        ALTER TABLE comments ADD COLUMN reactions JSONB DEFAULT '{}';
    END IF;
END $$;

-- Step 8: Add self-referencing foreign key for comment threading
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_parent_id_fkey;
ALTER TABLE comments 
ADD CONSTRAINT comments_parent_id_fkey 
FOREIGN KEY (parent_id) REFERENCES comments(id) 
ON DELETE CASCADE;

-- Step 9: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Step 10: Create a view for easy querying of comments with profiles
CREATE OR REPLACE VIEW comments_with_profiles AS
SELECT 
    c.id,
    c.post_id,
    c.user_id,
    c.content,
    c.parent_id,
    c.depth,
    c.likes_count,
    c.created_at,
    c.updated_at,
    c.reactions,
    p.id as profile_id,
    p.user_id as profile_user_id,
    p.display_name,
    p.avatar_url,
    p.major,
    p.year,
    p.bio
FROM comments c
INNER JOIN profiles p ON c.user_id = p.id;

-- Step 11: Grant permissions on the view
GRANT SELECT ON comments_with_profiles TO authenticated;
GRANT SELECT ON comments_with_profiles TO anon;

-- Step 12: Create a function to get comments with profiles using the relationship
CREATE OR REPLACE FUNCTION get_comments_with_profiles(post_uuid UUID, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    post_id UUID,
    user_id UUID,
    content TEXT,
    parent_id UUID,
    depth INTEGER,
    likes_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    reactions JSONB,
    profile_id UUID,
    profile_user_id UUID,
    display_name TEXT,
    avatar_url TEXT,
    major TEXT,
    year TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.parent_id,
        c.depth,
        c.likes_count,
        c.created_at,
        c.updated_at,
        c.reactions,
        p.id as profile_id,
        p.user_id as profile_user_id,
        p.display_name,
        p.avatar_url,
        p.major,
        p.year
    FROM comments c
    INNER JOIN profiles p ON c.user_id = p.id
    WHERE c.post_id = post_uuid
    ORDER BY c.created_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 13: Grant permissions on the function
GRANT EXECUTE ON FUNCTION get_comments_with_profiles(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_comments_with_profiles(UUID, INTEGER) TO anon;

-- Step 14: Update RLS policies to work with the new relationships
-- Drop existing policies
DROP POLICY IF EXISTS "Comments are viewable by users who can view the post" ON comments;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Users can create comments on posts they can view" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
DROP POLICY IF EXISTS "Post owners can delete comments on their posts" ON comments;

-- Create new policies
CREATE POLICY "Comments are viewable by users who can view the post"
ON comments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM posts p
        WHERE p.id = comments.post_id
        AND (
            p.user_id = auth.uid() 
            OR p.visibility = 'public'
            OR EXISTS (
                SELECT 1 FROM community_members cm
                WHERE cm.community_id = p.community_id 
                AND cm.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Users can create comments on posts they can view"
ON comments FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM posts p
        WHERE p.id = comments.post_id
        AND (
            p.user_id = auth.uid() 
            OR p.visibility = 'public'
            OR EXISTS (
                SELECT 1 FROM community_members cm
                WHERE cm.community_id = p.community_id 
                AND cm.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Users can update their own comments"
ON comments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON comments FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Post owners can delete comments on their posts"
ON comments FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM posts p
        WHERE p.id = comments.post_id
        AND p.user_id = auth.uid()
    )
);

-- Step 15: Create trigger for updating comments updated_at
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comments_updated_at();

-- Step 16: Update comment count trigger
CREATE OR REPLACE FUNCTION update_post_comment_count()
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

DROP TRIGGER IF EXISTS update_post_comment_count_trigger ON comments;
CREATE TRIGGER update_post_comment_count_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_post_comment_count();

-- Step 17: Update existing comment counts
UPDATE posts 
SET comments_count = (
    SELECT COUNT(*) 
    FROM comments 
    WHERE comments.post_id = posts.id
);

-- Step 18: Refresh the schema cache by updating table statistics
ANALYZE comments;
ANALYZE profiles;
ANALYZE posts;
ANALYZE likes;

-- Step 19: Add comments to document the relationships
COMMENT ON CONSTRAINT comments_user_id_fkey ON comments IS 'Foreign key to profiles(id) - enables auto-join with profile data';
COMMENT ON CONSTRAINT comments_post_id_fkey ON comments IS 'Foreign key to posts(id)';
COMMENT ON CONSTRAINT comments_parent_id_fkey ON comments IS 'Self-referencing foreign key for comment threading';
COMMENT ON CONSTRAINT posts_user_id_fkey ON posts IS 'Foreign key to profiles(id) - enables auto-join with profile data';
COMMENT ON CONSTRAINT likes_user_id_fkey ON likes IS 'Foreign key to profiles(id) - enables auto-join with profile data';

COMMENT ON VIEW comments_with_profiles IS 'View that automatically joins comments with their author profile information';
COMMENT ON FUNCTION get_comments_with_profiles(UUID, INTEGER) IS 'Function to get comments with profile data using proper foreign key relationship';

-- Step 20: Test the relationship by querying a sample
DO $$
DECLARE
    comment_count INTEGER;
    profile_join_count INTEGER;
BEGIN
    -- Count total comments
    SELECT COUNT(*) INTO comment_count FROM comments;
    
    -- Count comments that can be joined with profiles
    SELECT COUNT(*) INTO profile_join_count 
    FROM comments c 
    INNER JOIN profiles p ON c.user_id = p.id;
    
    -- Log the results
    RAISE NOTICE 'Total comments: %', comment_count;
    RAISE NOTICE 'Comments with profile joins: %', profile_join_count;
    RAISE NOTICE 'Relationship working: %', (profile_join_count = comment_count);
END $$;





















