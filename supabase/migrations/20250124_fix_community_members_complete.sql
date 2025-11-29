-- Complete fix for community_members join/leave system
-- This migration ensures unlimited join/leave cycles work correctly

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON public.community_members;
DROP POLICY IF EXISTS "Anyone can view community members" ON public.community_members;
DROP POLICY IF EXISTS "Members can view other members" ON public.community_members;
DROP POLICY IF EXISTS "Users can view community memberships" ON public.community_members;

-- 2. Clean up any invalid data (community_id not in communities_enhanced)
DELETE FROM public.community_members
WHERE community_id NOT IN (SELECT id FROM public.communities_enhanced);

-- 3. Ensure table structure is correct
-- (Table already exists, just ensure columns are correct)
ALTER TABLE public.community_members 
  ALTER COLUMN roles SET DEFAULT ARRAY['member']::text[];

-- 4. Ensure unique constraint exists (prevents duplicates)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'community_members_unique'
  ) THEN
    ALTER TABLE public.community_members
      ADD CONSTRAINT community_members_unique UNIQUE (community_id, user_id);
  END IF;
END $$;

-- 5. Ensure foreign key constraint is correct
DO $$
BEGIN
  -- Drop old constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'community_members_community_id_fkey'
  ) THEN
    ALTER TABLE public.community_members
      DROP CONSTRAINT community_members_community_id_fkey;
  END IF;
  
  -- Add correct foreign key with CASCADE
  ALTER TABLE public.community_members
    ADD CONSTRAINT community_members_community_id_fkey 
    FOREIGN KEY (community_id) 
    REFERENCES public.communities_enhanced(id) 
    ON DELETE CASCADE;
END $$;

-- 6. Create simple, correct RLS policies
CREATE POLICY "Users can join communities"
ON public.community_members
FOR INSERT
TO authenticated
WITH CHECK ( user_id = auth.uid() );

CREATE POLICY "Users can leave communities"
ON public.community_members
FOR DELETE
TO authenticated
USING ( user_id = auth.uid() );

CREATE POLICY "Anyone can view community members"
ON public.community_members
FOR SELECT
TO authenticated
USING ( true );

-- 7. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_community_members_lookup 
ON public.community_members(community_id, user_id);

-- 8. Add helpful comment
COMMENT ON TABLE public.community_members IS 'Community memberships - users can join/leave/rejoin unlimited times';



