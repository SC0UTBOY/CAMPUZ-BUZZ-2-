-- Debug Likes System
-- Run this in Supabase SQL Editor to check your setup

-- 1. Check if likes table exists
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'likes' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'likes';

-- 3. Check if posts table has likes_count column
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
  AND table_schema = 'public'
  AND column_name LIKE '%like%';

-- 4. Sample data check
SELECT COUNT(*) as total_posts FROM public.posts;
SELECT COUNT(*) as total_likes FROM public.likes;

-- 5. Check current user (run this to see your user ID)
SELECT auth.uid() as current_user_id;
