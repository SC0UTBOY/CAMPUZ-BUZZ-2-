
-- Fix critical security issues identified in the audit

-- 1. Add missing RLS policies for likes table to prevent unauthorized access
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
CREATE POLICY "Likes are viewable by authenticated users" ON public.likes
FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Restrict community data access to prevent public scraping
DROP POLICY IF EXISTS "Public communities are viewable by everyone" ON public.communities;
CREATE POLICY "Public communities are viewable by authenticated users" ON public.communities
FOR SELECT USING (NOT is_private AND auth.role() = 'authenticated');

-- 3. Fix search path security in database functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
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

-- 4. Add security event logging for failed authentication attempts
CREATE OR REPLACE FUNCTION public.log_failed_login_attempt()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.security_events (
    event_type,
    metadata,
    user_agent,
    created_at
  ) VALUES (
    'failed_login_attempt',
    jsonb_build_object(
      'severity', 'medium',
      'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for',
      'timestamp', now()
    ),
    current_setting('request.headers', true)::json->>'user-agent',
    now()
  );
END;
$function$;

-- 5. Add rate limiting table for enhanced security
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action_type text NOT NULL,
  attempts integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(identifier, action_type)
);

-- Enable RLS on rate limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy for rate limits (system only)
CREATE POLICY "System can manage rate limits" ON public.rate_limits
FOR ALL USING (true);

-- 6. Add user security settings table if not exists
CREATE TABLE IF NOT EXISTS public.user_security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  password_changed_at timestamp with time zone DEFAULT now(),
  failed_login_attempts integer DEFAULT 0,
  account_locked_until timestamp with time zone,
  two_factor_enabled boolean DEFAULT false,
  security_questions_set boolean DEFAULT false,
  login_notifications_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user security settings
CREATE POLICY "Users can view their own security settings" ON public.user_security_settings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own security settings" ON public.user_security_settings
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can manage security settings" ON public.user_security_settings
FOR INSERT WITH CHECK (true);

-- 7. Create trigger for new user security settings
CREATE OR REPLACE FUNCTION public.handle_new_user_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_security_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$function$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created_security ON auth.users;
CREATE TRIGGER on_auth_user_created_security
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_security();
