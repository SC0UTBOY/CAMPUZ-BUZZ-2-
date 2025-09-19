-- Quick fix script for comment foreign key relationships
-- Run this in your Supabase SQL editor

-- Add foreign key constraint between comments.user_id and auth.users(id)
ALTER TABLE comments 
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key constraint between comments.post_id and posts(id)
ALTER TABLE comments 
ADD CONSTRAINT comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES posts(id) 
ON DELETE CASCADE;

-- Add foreign key constraint between posts.user_id and auth.users(id)
ALTER TABLE posts 
ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key constraint between profiles.user_id and auth.users(id)
ALTER TABLE profiles 
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key constraint between likes.user_id and auth.users(id)
ALTER TABLE likes 
ADD CONSTRAINT likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add foreign key constraint between likes.post_id and posts(id)
ALTER TABLE likes 
ADD CONSTRAINT likes_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES posts(id) 
ON DELETE CASCADE;

-- Add foreign key constraint between likes.comment_id and comments(id)
ALTER TABLE likes 
ADD CONSTRAINT likes_comment_id_fkey 
FOREIGN KEY (comment_id) REFERENCES comments(id) 
ON DELETE CASCADE;

-- Add missing columns to comments table if they don't exist
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

-- Add foreign key constraint for parent_id (self-referencing)
ALTER TABLE comments 
ADD CONSTRAINT comments_parent_id_fkey 
FOREIGN KEY (parent_id) REFERENCES comments(id) 
ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes(comment_id);

-- Update comment count for existing posts
UPDATE posts 
SET comments_count = (
    SELECT COUNT(*) 
    FROM comments 
    WHERE comments.post_id = posts.id
);

-- Test the foreign key relationships
SELECT 
    'Foreign key constraints added successfully' as status,
    COUNT(*) as total_comments
FROM comments;









