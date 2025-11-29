-- Fix community_members foreign key constraint
-- The issue is that community_members.community_id might be pointing to the wrong table

-- First, check which table it currently references and drop it
ALTER TABLE public.community_members 
DROP CONSTRAINT IF EXISTS community_members_community_id_fkey;

-- Recreate the constraint to point to the correct table (communities, not communities_enhanced)
-- This matches where the UI is fetching from
ALTER TABLE public.community_members 
ADD CONSTRAINT community_members_community_id_fkey 
FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;

-- Ensure the constraint exists for user_id as well
ALTER TABLE public.community_members 
DROP CONSTRAINT IF EXISTS community_members_user_id_fkey;

ALTER TABLE public.community_members 
ADD CONSTRAINT community_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

