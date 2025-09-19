
-- Phase 1: Fix Role Escalation (CRITICAL)
-- Update the profiles table UPDATE policy to prevent role modification by regular users

-- First, drop the existing permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;

-- Create a new restrictive UPDATE policy that prevents role changes
CREATE POLICY "Users can update their own profiles (except role)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  -- Prevent role changes unless user is admin
  (
    OLD.role = NEW.role OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

-- Create admin-only role management function
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Update the target user's role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

-- Phase 3: Database Function Security (MEDIUM)
-- Update existing functions to include proper search_path settings

-- Update extract_hashtags function
CREATE OR REPLACE FUNCTION public.extract_hashtags(content text)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    hashtag_array text[];
BEGIN
    SELECT array_agg(DISTINCT lower(substring(word from 2)))
    INTO hashtag_array
    FROM regexp_split_to_table(content, '\s+') AS word
    WHERE word ~ '^#[a-zA-Z0-9_]+$';
    
    RETURN COALESCE(hashtag_array, '{}');
END;
$$;

-- Update increment_engagement_score function
CREATE OR REPLACE FUNCTION public.increment_engagement_score(user_uuid uuid, points integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles 
  SET engagement_score = engagement_score + points 
  WHERE user_id = user_uuid;
END;
$$;

-- Update update_hashtag_usage function
CREATE OR REPLACE FUNCTION public.update_hashtag_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    hashtag_names text[];
    hashtag_name text;
BEGIN
    -- Extract hashtags from post content
    hashtag_names := public.extract_hashtags(NEW.content);
    
    -- Insert or update hashtags
    FOREACH hashtag_name IN ARRAY hashtag_names
    LOOP
        INSERT INTO public.hashtags (name, usage_count)
        VALUES (hashtag_name, 1)
        ON CONFLICT (name) 
        DO UPDATE SET usage_count = hashtags.usage_count + 1;
        
        -- Link hashtag to post
        INSERT INTO public.post_hashtags (post_id, hashtag_id)
        SELECT NEW.id, h.id
        FROM public.hashtags h
        WHERE h.name = hashtag_name
        ON CONFLICT (post_id, hashtag_id) DO NOTHING;
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- Update can_view_profile function
CREATE OR REPLACE FUNCTION public.can_view_profile(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    CASE 
      WHEN target_user_id = auth.uid() THEN true
      WHEN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = target_user_id 
        AND (privacy_settings->>'profile_visible')::boolean = true
      ) THEN true
      WHEN EXISTS (
        SELECT 1 FROM public.community_members cm1
        JOIN public.community_members cm2 ON cm1.community_id = cm2.community_id
        WHERE cm1.user_id = auth.uid() 
        AND cm2.user_id = target_user_id
      ) THEN true
      WHEN EXISTS (
        SELECT 1 FROM public.study_group_members sgm1
        JOIN public.study_group_members sgm2 ON sgm1.study_group_id = sgm2.study_group_id
        WHERE sgm1.user_id = auth.uid() 
        AND sgm2.user_id = target_user_id
      ) THEN true
      ELSE false
    END;
$$;

-- Update get_public_profile_info function
CREATE OR REPLACE FUNCTION public.get_public_profile_info(target_user_id uuid)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
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

-- Update can_view_academic_info function
CREATE OR REPLACE FUNCTION public.can_view_academic_info(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    CASE 
      WHEN target_user_id = auth.uid() THEN true
      WHEN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = target_user_id 
        AND (privacy_settings->>'academic_info_visible')::boolean = true
        AND public.can_view_profile(target_user_id) = true
      ) THEN true
      ELSE false
    END;
$$;

-- Update is_community_member function
CREATE OR REPLACE FUNCTION public.is_community_member(community_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_id = community_uuid AND user_id = user_uuid
  );
$$;

-- Update is_study_group_member function
CREATE OR REPLACE FUNCTION public.is_study_group_member(group_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.study_group_members 
    WHERE study_group_id = group_uuid AND user_id = user_uuid
  );
$$;

-- Update can_moderate_community function
CREATE OR REPLACE FUNCTION public.can_moderate_community(community_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members cm
    JOIN public.community_roles cr ON cr.id = ANY(cm.roles)
    WHERE cm.community_id = community_uuid 
    AND cm.user_id = user_uuid 
    AND cr.can_moderate = true
  );
$$;

-- Update handle_new_user_security function
CREATE OR REPLACE FUNCTION public.handle_new_user_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_security_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;
