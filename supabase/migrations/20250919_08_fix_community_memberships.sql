-- Fix Community Memberships RLS Policies
-- This migration fixes references from the old community_memberships table to community_members

-- Drop old policies that reference community_memberships
DROP POLICY IF EXISTS "Anyone can view public posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can view comments on visible posts" ON public.comments;
DROP POLICY IF EXISTS "Anyone can view public communities" ON public.communities_enhanced;

-- Recreate policies with correct table name (community_members)
CREATE POLICY "Anyone can view public posts" ON public.posts
  FOR SELECT USING (
    visibility = 'public' OR 
    auth.uid() = user_id OR
    (visibility = 'community' AND community_id IN (
      SELECT community_id FROM public.community_members 
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Anyone can view comments on visible posts" ON public.comments
  FOR SELECT USING (
    post_id IN (
      SELECT id FROM public.posts 
      WHERE visibility = 'public' OR 
            auth.uid() = user_id OR
            (visibility = 'community' AND community_id IN (
              SELECT community_id FROM public.community_members 
              WHERE user_id = auth.uid()
            ))
    )
  );

CREATE POLICY "Anyone can view public communities" ON public.communities_enhanced
  FOR SELECT USING (
    NOT is_private OR 
    auth.uid() = created_by OR
    id IN (
      SELECT community_id FROM public.community_members 
      WHERE user_id = auth.uid()
    )
  );

-- Drop and recreate community_members policies to ensure they're correct
DROP POLICY IF EXISTS "Users can view community members" ON public.community_members;
DROP POLICY IF EXISTS "Users can view community memberships" ON public.community_members;
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON public.community_members;
DROP POLICY IF EXISTS "Members viewable by community members" ON public.community_members;

-- Create correct policies for community_members
CREATE POLICY "Users can view community members" ON public.community_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    community_id IN (
      SELECT community_id FROM public.community_members cm
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join communities" ON public.community_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities" ON public.community_members
  FOR DELETE USING (auth.uid() = user_id);

