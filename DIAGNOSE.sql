-- DIAGNOSTIC SCRIPT - Run this first to see what's wrong
-- Copy and paste this into your Supabase SQL Editor

-- Check if tables exist
SELECT 'Tables check:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('comments', 'profiles', 'posts')
ORDER BY table_name;

-- Check comments table structure
SELECT 'Comments table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'comments' 
ORDER BY ordinal_position;

-- Check profiles table structure  
SELECT 'Profiles table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check existing foreign key constraints
SELECT 'Existing foreign keys:' as info;
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
    AND tc.table_name = 'comments';

-- Check if there are any comments
SELECT 'Comments count:' as info;
SELECT COUNT(*) as total_comments FROM comments;

-- Check if there are any profiles
SELECT 'Profiles count:' as info;
SELECT COUNT(*) as total_profiles FROM profiles;

-- Try a simple join to see what happens
SELECT 'Join test:' as info;
SELECT COUNT(*) as joinable_comments
FROM comments c
INNER JOIN profiles p ON c.user_id = p.id;









