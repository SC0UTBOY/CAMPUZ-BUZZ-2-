-- Fix RLS Policy for community_members INSERT
-- This migration ensures users can only insert their own membership records

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;

-- Create correct INSERT policy
-- Users can only insert a record where user_id matches their auth.uid()
CREATE POLICY "Users can join communities" 
ON public.community_members
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Ensure SELECT policy exists so users can view memberships
DROP POLICY IF EXISTS "Users can view community members" ON public.community_members;

CREATE POLICY "Users can view community members" 
ON public.community_members
FOR SELECT
TO authenticated
USING (
  -- Users can see their own memberships
  user_id = auth.uid() 
  OR 
  -- Users can see members of communities they're in
  community_id IN (
    SELECT community_id FROM public.community_members cm
    WHERE cm.user_id = auth.uid()
  )
);

-- Ensure DELETE policy exists so users can leave communities
DROP POLICY IF EXISTS "Users can leave communities" ON public.community_members;

CREATE POLICY "Users can leave communities" 
ON public.community_members
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

