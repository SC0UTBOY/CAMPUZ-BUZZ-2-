-- SIMPLE FIX for comments-profiles relationship error
-- Run this step by step in your Supabase SQL Editor

-- Step 1: First, let's check what constraints exist
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
    AND tc.table_name = 'comments'
    AND kcu.column_name = 'user_id';

-- Step 2: Drop any existing foreign key constraints on comments.user_id
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

-- Step 3: Make sure profiles table has the right structure
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS profiles_pkey PRIMARY KEY (id);

-- Step 4: Add the foreign key relationship
ALTER TABLE comments 
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Step 5: Refresh schema cache
ANALYZE comments;
ANALYZE profiles;

-- Step 6: Test the relationship
SELECT 
    'Testing relationship...' as status,
    COUNT(*) as comments_count
FROM comments c
INNER JOIN profiles p ON c.user_id = p.id;





















