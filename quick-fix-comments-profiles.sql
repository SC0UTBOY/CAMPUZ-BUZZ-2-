-- Quick fix for comments-profiles relationship
-- Run this in your Supabase SQL editor to fix the schema cache issue

-- Step 1: Drop existing foreign key constraints
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;

-- Step 2: Ensure profiles table has proper primary key
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS profiles_pkey PRIMARY KEY (id);
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS profiles_user_id_key UNIQUE (user_id);

-- Step 3: Add correct foreign key relationships
-- This is the key fix - comments.user_id should reference profiles.id
ALTER TABLE comments 
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

ALTER TABLE posts 
ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

ALTER TABLE likes 
ADD CONSTRAINT likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Step 4: Ensure comments.post_id references posts.id
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;
ALTER TABLE comments 
ADD CONSTRAINT comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES posts(id) 
ON DELETE CASCADE;

-- Step 5: Add missing columns to comments if they don't exist
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

-- Step 6: Add self-referencing foreign key for comment threading
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_parent_id_fkey;
ALTER TABLE comments 
ADD CONSTRAINT comments_parent_id_fkey 
FOREIGN KEY (parent_id) REFERENCES comments(id) 
ON DELETE CASCADE;

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Step 8: Create a view for easy querying
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
    p.year
FROM comments c
INNER JOIN profiles p ON c.user_id = p.id;

-- Step 9: Grant permissions
GRANT SELECT ON comments_with_profiles TO authenticated;
GRANT SELECT ON comments_with_profiles TO anon;

-- Step 10: Refresh schema cache
ANALYZE comments;
ANALYZE profiles;
ANALYZE posts;

-- Step 11: Test the relationship
SELECT 
    'Foreign key relationships created successfully' as status,
    COUNT(*) as total_comments,
    COUNT(DISTINCT c.user_id) as unique_commenters,
    COUNT(p.id) as comments_with_profiles
FROM comments c
LEFT JOIN profiles p ON c.user_id = p.id;

-- Step 12: Show the relationship structure
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('comments', 'posts', 'likes')
    AND kcu.column_name = 'user_id'
ORDER BY tc.table_name;









