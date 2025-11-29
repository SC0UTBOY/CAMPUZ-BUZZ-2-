-- IMMEDIATE FIX for "Could not find a relationship between 'comments' and 'profiles' in the schema cache"
-- Copy and paste this entire script into your Supabase SQL Editor and run it

-- Step 1: Drop any existing foreign key constraints that might be incorrect
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_user_id_fkey;

-- Step 2: Ensure profiles table has proper primary key
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS profiles_pkey PRIMARY KEY (id);
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS profiles_user_id_key UNIQUE (user_id);

-- Step 3: Add the correct foreign key relationship - THIS IS THE KEY FIX
ALTER TABLE comments 
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Step 4: Add foreign key for posts as well
ALTER TABLE posts 
ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Step 5: Add foreign key for likes
ALTER TABLE likes 
ADD CONSTRAINT likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Step 6: Ensure comments.post_id references posts.id
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;
ALTER TABLE comments 
ADD CONSTRAINT comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES posts(id) 
ON DELETE CASCADE;

-- Step 7: Add missing columns to comments if they don't exist
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

-- Step 10: REFRESH THE SCHEMA CACHE - This is crucial!
ANALYZE comments;
ANALYZE profiles;
ANALYZE posts;
ANALYZE likes;

-- Step 11: Test the relationship
SELECT 
    'SUCCESS: Foreign key relationships created' as status,
    COUNT(*) as total_comments,
    COUNT(DISTINCT c.user_id) as unique_commenters
FROM comments c
LEFT JOIN profiles p ON c.user_id = p.id;

-- Step 12: Show the relationship structure
SELECT 
    'comments.user_id' as source_column,
    'profiles.id' as target_column,
    'FOREIGN KEY' as relationship_type,
    'comments_user_id_fkey' as constraint_name;





















