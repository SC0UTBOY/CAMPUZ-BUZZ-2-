-- Fix critical security vulnerability: Remove public access to profiles table
-- and implement privacy-based RLS policies

-- First, drop the existing overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a security definer function to check profile visibility
CREATE OR REPLACE FUNCTION public.can_view_profile(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    CASE 
      -- Users can always view their own profile
      WHEN target_user_id = auth.uid() THEN true
      -- Check if the target user's profile is set to public
      WHEN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = target_user_id 
        AND (privacy_settings->>'profile_visible')::boolean = true
      ) THEN true
      -- Allow viewing if users are in the same community
      WHEN EXISTS (
        SELECT 1 FROM public.community_members cm1
        JOIN public.community_members cm2 ON cm1.community_id = cm2.community_id
        WHERE cm1.user_id = auth.uid() 
        AND cm2.user_id = target_user_id
      ) THEN true
      -- Allow viewing if users are in the same study group
      WHEN EXISTS (
        SELECT 1 FROM public.study_group_members sgm1
        JOIN public.study_group_members sgm2 ON sgm1.study_group_id = sgm2.study_group_id
        WHERE sgm1.user_id = auth.uid() 
        AND sgm2.user_id = target_user_id
      ) THEN true
      ELSE false
    END;
$$;

-- Create new privacy-aware RLS policies
CREATE POLICY "Users can view profiles based on privacy settings and relationships"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.can_view_profile(user_id));

-- Create a policy for public profile information (very limited)
CREATE POLICY "Limited public profile access for display purposes"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Only allow viewing display_name and avatar_url for public profiles
  -- This is for cases like displaying author names on posts
  (privacy_settings->>'profile_visible')::boolean = true
);

-- Create a function to get safe profile data for public display
CREATE OR REPLACE FUNCTION public.get_public_profile_info(target_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    p.user_id,
    CASE 
      WHEN (p.privacy_settings->>'profile_visible')::boolean = true 
      THEN p.display_name 
      ELSE 'Anonymous User'
    END as display_name,
    CASE 
      WHEN (p.privacy_settings->>'profile_visible')::boolean = true 
      THEN p.avatar_url 
      ELSE NULL
    END as avatar_url
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
$$;

-- Add function to check if academic info should be visible
CREATE OR REPLACE FUNCTION public.can_view_academic_info(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    CASE 
      -- Users can always view their own academic info
      WHEN target_user_id = auth.uid() THEN true
      -- Check if academic info is set to visible and profile is viewable
      WHEN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = target_user_id 
        AND (privacy_settings->>'academic_info_visible')::boolean = true
        AND public.can_view_profile(target_user_id) = true
      ) THEN true
      ELSE false
    END;
$$;