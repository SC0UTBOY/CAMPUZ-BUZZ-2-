
-- Fix infinite recursion in RLS policies and add missing RLS policies
-- This addresses critical security vulnerabilities

-- Fix 1: Create security definer functions to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.is_community_member(community_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_id = community_uuid AND user_id = user_uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.is_study_group_member(group_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.study_group_members 
    WHERE study_group_id = group_uuid AND user_id = user_uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.can_moderate_community(community_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
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

-- Fix 2: Update existing policies with infinite recursion
DROP POLICY IF EXISTS "Members viewable by community members" ON public.community_members;
CREATE POLICY "Members viewable by community members"
ON public.community_members
FOR SELECT
TO authenticated
USING (public.is_community_member(community_id, auth.uid()));

DROP POLICY IF EXISTS "Study group members are viewable by group members" ON public.study_group_members;
CREATE POLICY "Study group members are viewable by group members"
ON public.study_group_members
FOR SELECT
TO authenticated
USING (public.is_study_group_member(study_group_id, auth.uid()));

DROP POLICY IF EXISTS "Event RSVPs are visible to event attendees" ON public.event_rsvps;
CREATE POLICY "Event RSVPs are visible to event attendees"
ON public.event_rsvps
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_rsvps.event_id 
    AND (
      e.is_public = true 
      OR e.created_by = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM public.event_rsvps er 
        WHERE er.event_id = e.id AND er.user_id = auth.uid()
      )
    )
  )
);

-- Fix 3: Add missing RLS policies for unprotected tables

-- Community Roles - Only community admins can manage roles
ALTER TABLE public.community_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community roles viewable by members"
ON public.community_roles
FOR SELECT
TO authenticated
USING (public.is_community_member(community_id, auth.uid()));

CREATE POLICY "Community admins can manage roles"
ON public.community_roles
FOR ALL
TO authenticated
USING (public.can_moderate_community(community_id, auth.uid()));

-- Custom Emojis - Community members can view, admins can manage
ALTER TABLE public.custom_emojis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Custom emojis viewable by community members"
ON public.custom_emojis
FOR SELECT
TO authenticated
USING (public.is_community_member(community_id, auth.uid()));

CREATE POLICY "Community admins can manage custom emojis"
ON public.custom_emojis
FOR ALL
TO authenticated
USING (public.can_moderate_community(community_id, auth.uid()));

-- Message Reads - Users can only access their own read status
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own message reads"
ON public.message_reads
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Moderation Logs - Only moderators can view logs for their communities
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can view community moderation logs"
ON public.moderation_logs
FOR SELECT
TO authenticated
USING (public.can_moderate_community(community_id, auth.uid()));

CREATE POLICY "Moderators can create moderation logs"
ON public.moderation_logs
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_moderate_community(community_id, auth.uid()) 
  AND auth.uid() = moderator_id
);

-- Pinned Messages - Community members can view, moderators can manage
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pinned messages viewable by channel members"
ON public.pinned_messages
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN channel_id IS NOT NULL THEN (
      EXISTS (
        SELECT 1 FROM public.community_channels cc
        WHERE cc.id = pinned_messages.channel_id
        AND public.is_community_member(cc.community_id, auth.uid())
      )
    )
    WHEN dm_conversation_id IS NOT NULL THEN (
      EXISTS (
        SELECT 1 FROM public.dm_conversations dc
        WHERE dc.id = pinned_messages.dm_conversation_id
        AND auth.uid() = ANY(dc.participants)
      )
    )
    ELSE false
  END
);

CREATE POLICY "Users can pin/unpin messages"
ON public.pinned_messages
FOR ALL
TO authenticated
USING (
  CASE
    WHEN channel_id IS NOT NULL THEN (
      EXISTS (
        SELECT 1 FROM public.community_channels cc
        WHERE cc.id = pinned_messages.channel_id
        AND public.can_moderate_community(cc.community_id, auth.uid())
      )
    )
    WHEN dm_conversation_id IS NOT NULL THEN (
      EXISTS (
        SELECT 1 FROM public.dm_conversations dc
        WHERE dc.id = pinned_messages.dm_conversation_id
        AND auth.uid() = ANY(dc.participants)
      )
    )
    ELSE false
  END
);

-- Typing Indicators - Users in same channel/conversation can view
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Typing indicators viewable by channel/conversation members"
ON public.typing_indicators
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN channel_id IS NOT NULL THEN (
      EXISTS (
        SELECT 1 FROM public.community_channels cc
        WHERE cc.id = typing_indicators.channel_id
        AND public.is_community_member(cc.community_id, auth.uid())
      )
    )
    WHEN dm_conversation_id IS NOT NULL THEN (
      EXISTS (
        SELECT 1 FROM public.dm_conversations dc
        WHERE dc.id = typing_indicators.dm_conversation_id
        AND auth.uid() = ANY(dc.participants)
      )
    )
    ELSE false
  END
);

CREATE POLICY "Users can manage their own typing indicators"
ON public.typing_indicators
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Voice Sessions - Participants can view/manage their sessions
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voice sessions viewable by channel members"
ON public.voice_sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.community_channels cc
    WHERE cc.id = voice_sessions.channel_id
    AND public.is_community_member(cc.community_id, auth.uid())
  )
);

CREATE POLICY "Users can manage voice sessions they started"
ON public.voice_sessions
FOR ALL
TO authenticated
USING (auth.uid() = started_by);

-- Fix 4: Update existing security definer functions to include search_path
CREATE OR REPLACE FUNCTION public.can_view_profile(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
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

CREATE OR REPLACE FUNCTION public.get_public_profile_info(target_user_id uuid)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text)
LANGUAGE sql
SECURITY DEFINER
STABLE
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

CREATE OR REPLACE FUNCTION public.can_view_academic_info(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
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

-- Fix other existing functions
CREATE OR REPLACE FUNCTION public.increment_engagement_score(user_uuid uuid, points integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles 
  SET engagement_score = engagement_score + points 
  WHERE user_id = user_uuid;
END;
$$;

CREATE OR REPLACE FUNCTION public.extract_hashtags(content text)
RETURNS text[]
LANGUAGE plpgsql
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
