
-- Fix RLS policies for likes table to restrict access properly
DROP POLICY IF EXISTS "Likes are viewable by authenticated users" ON public.likes;
CREATE POLICY "Users can view likes on posts they can access" ON public.likes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.posts p 
    WHERE p.id = likes.post_id 
    AND (
      p.user_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM public.community_members cm 
        WHERE cm.community_id = p.community_id 
        AND cm.user_id = auth.uid()
      )
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.comments c 
    WHERE c.id = likes.comment_id 
    AND (
      c.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.posts p2
        JOIN public.community_members cm2 ON cm2.community_id = p2.community_id
        WHERE p2.id = c.post_id 
        AND cm2.user_id = auth.uid()
      )
    )
  )
);

-- Secure communities from public scraping by adding stricter RLS
DROP POLICY IF EXISTS "Public communities are viewable by authenticated users" ON public.communities;
CREATE POLICY "Communities are viewable by authenticated members only" ON public.communities
FOR SELECT USING (
  auth.role() = 'authenticated'::text 
  AND (
    NOT is_private 
    OR is_community_member(id, auth.uid())
  )
);

-- Fix database function search paths for security
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_community_member(community_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_id = community_uuid AND user_id = user_uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.is_study_group_member(group_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.study_group_members 
    WHERE study_group_id = group_uuid AND user_id = user_uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.can_moderate_community(community_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members cm
    JOIN public.community_roles cr ON cr.id = ANY(cm.roles)
    WHERE cm.community_id = community_uuid 
    AND cm.user_id = user_uuid 
    AND cr.can_moderate = true
  );
$$;

-- Add table for leaked password protection
CREATE TABLE IF NOT EXISTS public.compromised_passwords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash text NOT NULL UNIQUE,
  reported_at timestamp with time zone DEFAULT now(),
  source text
);

ALTER TABLE public.compromised_passwords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage compromised passwords" ON public.compromised_passwords
FOR ALL USING (true);

-- Add push notification tokens table
CREATE TABLE IF NOT EXISTS public.push_notification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('web', 'android', 'ios')),
  created_at timestamp with time zone DEFAULT now(),
  last_used timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(user_id, token)
);

ALTER TABLE public.push_notification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification tokens" ON public.push_notification_tokens
FOR ALL USING (auth.uid() = user_id);

-- Add user behavior analytics table
CREATE TABLE IF NOT EXISTS public.user_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  session_id text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can log analytics" ON public.user_analytics
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own analytics" ON public.user_analytics
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics" ON public.user_analytics
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);
