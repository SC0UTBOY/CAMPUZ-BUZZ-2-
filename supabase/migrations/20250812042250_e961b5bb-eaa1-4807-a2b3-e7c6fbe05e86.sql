
-- Phase 1: Critical Database Security Fixes

-- Fix 1: Remove overly permissive profile access policy and implement proper privacy controls
DROP POLICY IF EXISTS "Limited public profile access for display purposes" ON public.profiles;

-- Create new secure profile visibility policy
CREATE POLICY "Secure profile visibility with privacy controls" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can always see their own profile
  auth.uid() = user_id 
  OR 
  -- For other users, check privacy settings and relationships
  (
    ((privacy_settings->>'profile_visible')::boolean = true) 
    AND 
    (
      -- Allow access if users share a community
      EXISTS (
        SELECT 1 FROM community_members cm1
        JOIN community_members cm2 ON cm1.community_id = cm2.community_id
        WHERE cm1.user_id = auth.uid() AND cm2.user_id = profiles.user_id
      )
      OR
      -- Allow access if users share a study group
      EXISTS (
        SELECT 1 FROM study_group_members sgm1
        JOIN study_group_members sgm2 ON sgm1.study_group_id = sgm2.study_group_id
        WHERE sgm1.user_id = auth.uid() AND sgm2.user_id = profiles.user_id
      )
    )
  )
);

-- Fix 2: Secure community membership data
DROP POLICY IF EXISTS "Community memberships are viewable by everyone" ON public.community_memberships;

CREATE POLICY "Community memberships viewable by community members only" 
ON public.community_memberships 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = community_memberships.community_id 
    AND cm.user_id = auth.uid()
  )
);

-- Fix 3: Secure database functions by adding search_path protection
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

-- Fix 4: Add rate limiting table for enhanced security
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  event_type TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only allow users to view their own security events
CREATE POLICY "Users can view their own security events" 
ON public.security_events 
FOR SELECT 
USING (auth.uid() = user_id);

-- System can insert security events
CREATE POLICY "System can log security events" 
ON public.security_events 
FOR INSERT 
WITH CHECK (true);

-- Fix 5: Add password security tracking
CREATE TABLE IF NOT EXISTS public.user_security_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked_until TIMESTAMP WITH TIME ZONE,
  two_factor_enabled BOOLEAN DEFAULT false,
  security_questions_set BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;

-- Users can manage their own security settings
CREATE POLICY "Users can manage their own security settings" 
ON public.user_security_settings 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger to auto-create security settings for new users
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

-- Create trigger (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created_security'
  ) THEN
    CREATE TRIGGER on_auth_user_created_security
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_security();
  END IF;
END
$$;
