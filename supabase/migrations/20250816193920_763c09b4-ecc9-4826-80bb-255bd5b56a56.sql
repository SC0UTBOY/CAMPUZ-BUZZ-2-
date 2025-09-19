
-- Fix Critical Security Issues and Warnings

-- 1. Secure user_security_settings table with more restrictive RLS
DROP POLICY IF EXISTS "Users can manage their own security settings" ON public.user_security_settings;

CREATE POLICY "Users can view own security settings" 
ON public.user_security_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own security settings" 
ON public.user_security_settings 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own security settings" 
ON public.user_security_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 2. Secure user_reports table - only allow moderators/admins to view
DROP POLICY IF EXISTS "Users can create user reports" ON public.user_reports;

CREATE POLICY "Users can create user reports" 
ON public.user_reports 
FOR INSERT 
WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Moderators can view user reports" 
ON public.user_reports 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

CREATE POLICY "Moderators can update user reports" 
ON public.user_reports 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- 3. Secure community_reports table
DROP POLICY IF EXISTS "Users can create community reports" ON public.community_reports;
DROP POLICY IF EXISTS "Moderators can view community reports" ON public.community_reports;

CREATE POLICY "Users can create community reports" 
ON public.community_reports 
FOR INSERT 
WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Moderators can view community reports" 
ON public.community_reports 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

CREATE POLICY "Moderators can update community reports" 
ON public.community_reports 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- 4. Secure moderation_actions table - only moderators/admins
DROP POLICY IF EXISTS "Moderators can manage moderation actions" ON public.moderation_actions;

CREATE POLICY "Moderators can view moderation actions" 
ON public.moderation_actions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

CREATE POLICY "Moderators can create moderation actions" 
ON public.moderation_actions 
FOR INSERT 
WITH CHECK (
  auth.uid() = moderator_id AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

CREATE POLICY "Moderators can update moderation actions" 
ON public.moderation_actions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- 5. Secure analytics_events table - only allow users to see their own data and admins to see all
DROP POLICY IF EXISTS "Users can view their own analytics events" ON public.analytics_events;

CREATE POLICY "Users can view own analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 6. Fix function security by setting proper search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.is_community_member(community_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_id = community_uuid AND user_id = user_uuid
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_study_group_member(group_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.study_group_members 
    WHERE study_group_id = group_uuid AND user_id = user_uuid
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_moderate_community(community_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members cm
    JOIN public.community_roles cr ON cr.id = ANY(cm.roles)
    WHERE cm.community_id = community_uuid 
    AND cm.user_id = user_uuid 
    AND cr.can_moderate = true
  );
$function$;

-- 7. Enhanced privacy controls for profiles
CREATE OR REPLACE FUNCTION public.can_view_profile(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- 8. Add content flagging table with proper RLS for automated moderation
CREATE TABLE IF NOT EXISTS public.content_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  reason TEXT,
  confidence_score FLOAT,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.content_moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can view moderation logs" 
ON public.content_moderation_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

CREATE POLICY "System can insert moderation logs" 
ON public.content_moderation_logs 
FOR INSERT 
WITH CHECK (true);

-- 9. Create missing user_reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_user_id UUID NOT NULL REFERENCES auth.users(id),
  reported_by UUID NOT NULL REFERENCES auth.users(id),
  category TEXT NOT NULL DEFAULT 'other',
  reason TEXT NOT NULL,
  description TEXT,
  evidence_urls TEXT[],
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT
);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
