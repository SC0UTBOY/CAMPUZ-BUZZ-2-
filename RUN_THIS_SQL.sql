-- ============================================
-- CRITICAL FIX FOR JOIN COMMUNITY FEATURE
-- ============================================
-- 
-- Problem: community_members.community_id FK points to communities_enhanced
-- But UI loads from communities table
-- 
-- Solution: Point FK to communities table instead
-- ============================================

-- Step 1: Drop the incorrect foreign key constraint
ALTER TABLE public.community_members 
DROP CONSTRAINT IF EXISTS community_members_community_id_fkey;

-- Step 2: Recreate it pointing to the correct table
ALTER TABLE public.community_members 
ADD CONSTRAINT community_members_community_id_fkey 
FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

-- Step 3: Verify it worked
SELECT 
  tc.constraint_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'community_members'
  AND tc.constraint_name = 'community_members_community_id_fkey';

-- Expected result: foreign_table_name should be "communities"

