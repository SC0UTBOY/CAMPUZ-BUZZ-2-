-- Fix comment system foreign key relationships
-- This migration adds proper foreign key constraints between comments and users/posts

-- First, let's check if the foreign keys already exist and drop them if they do
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
        WHERE constraint_name = 'comments_post_id_fkey' 
        AND table_name = 'comments'
    ) THEN
        ALTER TABLE comments DROP CONSTRAINT comments_post_id_fkey;
    END IF;
END $$;

-- Add foreign key constraint between comments.user_id and auth.users(id)
-- Note: In Supabase, the auth.users table is in the auth schema
ALTER TABLE comments 
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key constraint between comments.post_id and posts.id
ALTER TABLE comments 
ADD CONSTRAINT comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES posts(id) 
ON DELETE CASCADE;

-- Add foreign key constraint between posts.user_id and auth.users(id)
-- This ensures posts are also properly linked to users
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'posts_user_id_fkey' 
        AND table_name = 'posts'
    ) THEN
        ALTER TABLE posts 
        ADD CONSTRAINT posts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint between posts.community_id and communities.id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'posts_community_id_fkey' 
        AND table_name = 'posts'
    ) THEN
        ALTER TABLE posts 
        ADD CONSTRAINT posts_community_id_fkey 
        FOREIGN KEY (community_id) REFERENCES communities(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Add foreign key constraint between communities.created_by and auth.users(id)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'communities_created_by_fkey' 
        AND table_name = 'communities'
    ) THEN
        ALTER TABLE communities 
        ADD CONSTRAINT communities_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint between profiles.user_id and auth.users(id)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_user_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint between likes.user_id and auth.users(id)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'likes_user_id_fkey' 
        AND table_name = 'likes'
    ) THEN
        ALTER TABLE likes 
        ADD CONSTRAINT likes_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint between likes.post_id and posts(id)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'likes_post_id_fkey' 
        AND table_name = 'likes'
    ) THEN
        ALTER TABLE likes 
        ADD CONSTRAINT likes_post_id_fkey 
        FOREIGN KEY (post_id) REFERENCES posts(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint between likes.comment_id and comments(id)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'likes_comment_id_fkey' 
        AND table_name = 'likes'
    ) THEN
        ALTER TABLE likes 
        ADD CONSTRAINT likes_comment_id_fkey 
        FOREIGN KEY (comment_id) REFERENCES comments(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance on foreign key lookups
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON posts(community_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes(comment_id);

-- Update the comments table to ensure it has all necessary columns for threading
-- Add parent_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'parent_id'
    ) THEN
        ALTER TABLE comments ADD COLUMN parent_id UUID;
    END IF;
END $$;

-- Add depth column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'depth'
    ) THEN
        ALTER TABLE comments ADD COLUMN depth INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE comments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- Add reactions column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'reactions'
    ) THEN
        ALTER TABLE comments ADD COLUMN reactions JSONB DEFAULT '{}';
    END IF;
END $$;

-- Add foreign key constraint for parent_id (self-referencing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'comments_parent_id_fkey' 
        AND table_name = 'comments'
    ) THEN
        ALTER TABLE comments 
        ADD CONSTRAINT comments_parent_id_fkey 
        FOREIGN KEY (parent_id) REFERENCES comments(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Create trigger for updating comments updated_at
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comments_updated_at();

-- Create a function to get comment with user profile information
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
    profiles JSONB
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
        jsonb_build_object(
            'id', p.user_id,
            'display_name', p.display_name,
            'avatar_url', p.avatar_url,
            'major', p.major,
            'year', p.year
        ) as profiles
    FROM comments c
    LEFT JOIN profiles p ON c.user_id = p.user_id
    WHERE c.post_id = post_uuid
    ORDER BY c.created_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_comments_with_profiles(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_comments_with_profiles(UUID, INTEGER) TO anon;

-- Update RLS policies to work with the new foreign key relationships
-- Ensure comments can be viewed by users who can view the post
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
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

-- Ensure users can only create comments on posts they can view
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
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

-- Ensure users can only update their own comments
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
CREATE POLICY "Users can update their own comments"
ON comments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure users can only delete their own comments
CREATE POLICY "Users can delete their own comments"
ON comments FOR DELETE
USING (auth.uid() = user_id);

-- Add a policy for comment deletion by post owners (optional)
CREATE POLICY "Post owners can delete comments on their posts"
ON comments FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM posts p
        WHERE p.id = comments.post_id
        AND p.user_id = auth.uid()
    )
);

-- Update the comment count trigger to work with the new schema
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

-- Recreate the comment count trigger
DROP TRIGGER IF EXISTS update_post_comment_count_trigger ON comments;
CREATE TRIGGER update_post_comment_count_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_post_comment_count();

-- Update existing comment counts to be accurate
UPDATE posts 
SET comments_count = (
    SELECT COUNT(*) 
    FROM comments 
    WHERE comments.post_id = posts.id
);

-- Add a comment to verify the foreign key relationships work
COMMENT ON CONSTRAINT comments_user_id_fkey ON comments IS 'Foreign key to auth.users(id)';
COMMENT ON CONSTRAINT comments_post_id_fkey ON comments IS 'Foreign key to posts(id)';
COMMENT ON CONSTRAINT comments_parent_id_fkey ON comments IS 'Self-referencing foreign key for comment threading';





















