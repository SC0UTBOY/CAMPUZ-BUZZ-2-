
-- Fix search_path for all database functions to prevent SQL injection
CREATE OR REPLACE FUNCTION public.update_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Update posts search vector
  IF TG_TABLE_NAME = 'posts' THEN
    NEW.search_vector := to_tsvector('english', 
      COALESCE(NEW.title, '') || ' ' || 
      COALESCE(NEW.content, '') || ' ' || 
      COALESCE(array_to_string(NEW.tags, ' '), '')
    );
  END IF;
  
  -- Update profiles search vector
  IF TG_TABLE_NAME = 'profiles' THEN
    NEW.search_vector := to_tsvector('english', 
      COALESCE(NEW.display_name, '') || ' ' || 
      COALESCE(NEW.bio, '') || ' ' || 
      COALESCE(NEW.major, '') || ' ' || 
      COALESCE(NEW.school, '') || ' ' ||
      COALESCE(array_to_string(NEW.skills, ' '), '') || ' ' ||
      COALESCE(array_to_string(NEW.interests, ' '), '')
    );
  END IF;
  
  -- Update communities search vector
  IF TG_TABLE_NAME = 'communities' THEN
    NEW.search_vector := to_tsvector('english', 
      COALESCE(NEW.name, '') || ' ' || 
      COALESCE(NEW.description, '') || ' ' || 
      COALESCE(NEW.category, '')
    );
  END IF;
  
  -- Update events search vector
  IF TG_TABLE_NAME = 'events' THEN
    NEW.search_vector := to_tsvector('english', 
      COALESCE(NEW.title, '') || ' ' || 
      COALESCE(NEW.description, '') || ' ' || 
      COALESCE(NEW.location, '') || ' ' ||
      COALESCE(array_to_string(NEW.tags, ' '), '')
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix search_path for get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$function$;

-- Fix search_path for cleanup_old_typing_indicators function
CREATE OR REPLACE FUNCTION public.cleanup_old_typing_indicators()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.typing_indicators 
  WHERE started_at < NOW() - INTERVAL '10 seconds';
END;
$function$;

-- Fix search_path for auto_join_study_group_creator function
CREATE OR REPLACE FUNCTION public.auto_join_study_group_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.study_group_members (study_group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$function$;

-- Fix search_path for get_study_suggestions function
CREATE OR REPLACE FUNCTION public.get_study_suggestions(user_uuid uuid)
RETURNS TABLE(suggestion_type text, title text, description text, relevance_score integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- This is a mock function that would normally call an AI service
  RETURN QUERY
  SELECT 
    'topic'::TEXT as suggestion_type,
    'Advanced React Patterns'::TEXT as title,
    'Based on your Computer Science major and recent posts about React'::TEXT as description,
    95::INTEGER as relevance_score
  UNION ALL
  SELECT 
    'group'::TEXT,
    'Study Group: Data Structures'::TEXT,
    'Join this active study group with students from your major'::TEXT,
    88::INTEGER
  UNION ALL
  SELECT 
    'post'::TEXT,
    'How to ace CS 101 midterms'::TEXT,
    'Popular post from senior students in your department'::TEXT,
    82::INTEGER;
END;
$function$;

-- Fix search_path for increment_engagement_score function
CREATE OR REPLACE FUNCTION public.increment_engagement_score(user_uuid uuid, points integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles 
  SET engagement_score = engagement_score + points 
  WHERE user_id = user_uuid;
END;
$function$;

-- Fix search_path for create_default_community_roles function
CREATE OR REPLACE FUNCTION public.create_default_community_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Create admin role
  INSERT INTO public.community_roles (community_id, name, color, position, permissions)
  VALUES (NEW.id, 'Admin', '#ff4444', 100, '{"manage_channels": true, "manage_roles": true, "manage_members": true, "delete_messages": true}');
  
  -- Create moderator role  
  INSERT INTO public.community_roles (community_id, name, color, position, permissions)
  VALUES (NEW.id, 'Moderator', '#5865f2', 50, '{"delete_messages": true, "manage_members": true}');
  
  -- Create member role
  INSERT INTO public.community_roles (community_id, name, color, position, permissions)
  VALUES (NEW.id, 'Member', '#99aab5', 10, '{"send_messages": true, "read_messages": true}');
  
  -- Create general channel
  INSERT INTO public.community_channels (community_id, name, description, created_by, position)
  VALUES (NEW.id, 'general', 'General discussion', NEW.created_by, 0);
  
  RETURN NEW;
END;
$function$;

-- Fix search_path for extract_hashtags function
CREATE OR REPLACE FUNCTION public.extract_hashtags(content text)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    hashtag_array text[];
BEGIN
    SELECT array_agg(DISTINCT lower(substring(word from 2)))
    INTO hashtag_array
    FROM regexp_split_to_table(content, '\s+') AS word
    WHERE word ~ '^#[a-zA-Z0-9_]+$';
    
    RETURN COALESCE(hashtag_array, '{}');
END;
$function$;

-- Fix search_path for update_hashtag_usage function
CREATE OR REPLACE FUNCTION public.update_hashtag_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Fix search_path for update_likes_count function
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment likes count
    UPDATE public.posts 
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement likes count
    UPDATE public.posts 
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Fix search_path for update_session_participant_count function
CREATE OR REPLACE FUNCTION public.update_session_participant_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update session with new participant count
    UPDATE public.study_sessions 
    SET max_participants = COALESCE(max_participants, 0)
    WHERE id = NEW.session_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Handle participant removal
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Fix search_path for record_study_group_analytics function
CREATE OR REPLACE FUNCTION public.record_study_group_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Record member join
    IF TG_TABLE_NAME = 'study_group_members' THEN
      INSERT INTO public.study_group_analytics (study_group_id, metric_type, metric_value)
      VALUES (NEW.study_group_id, 'member_joined', jsonb_build_object('user_id', NEW.user_id, 'role', NEW.role));
    -- Record session creation
    ELSIF TG_TABLE_NAME = 'study_sessions' THEN
      INSERT INTO public.study_group_analytics (study_group_id, metric_type, metric_value)
      VALUES (NEW.study_group_id, 'session_created', jsonb_build_object('session_id', NEW.id, 'title', NEW.title));
    -- Record material upload
    ELSIF TG_TABLE_NAME = 'study_materials' THEN
      INSERT INTO public.study_group_analytics (study_group_id, metric_type, metric_value)
      VALUES (NEW.study_group_id, 'material_uploaded', jsonb_build_object('material_id', NEW.id, 'title', NEW.title, 'uploaded_by', NEW.uploaded_by));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$;

-- Fix search_path for is_community_member function
CREATE OR REPLACE FUNCTION public.is_community_member(community_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_id = community_uuid AND user_id = user_uuid
  );
$function$;

-- Fix search_path for is_study_group_member function
CREATE OR REPLACE FUNCTION public.is_study_group_member(group_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.study_group_members 
    WHERE study_group_id = group_uuid AND user_id = user_uuid
  );
$function$;

-- Fix search_path for can_moderate_community function
CREATE OR REPLACE FUNCTION public.can_moderate_community(community_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members cm
    JOIN public.community_roles cr ON cr.id = ANY(cm.roles)
    WHERE cm.community_id = community_uuid 
    AND cm.user_id = user_uuid 
    AND cr.can_moderate = true
  );
$function$;

-- Fix search_path for handle_new_user_security function
CREATE OR REPLACE FUNCTION public.handle_new_user_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.user_security_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$function$;

-- Fix search_path for can_view_profile function
CREATE OR REPLACE FUNCTION public.can_view_profile(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
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

-- Fix search_path for get_public_profile_info function
CREATE OR REPLACE FUNCTION public.get_public_profile_info(target_user_id uuid)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Fix search_path for can_view_academic_info function
CREATE OR REPLACE FUNCTION public.can_view_academic_info(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Fix search_path for update_event_attendee_count function
CREATE OR REPLACE FUNCTION public.update_event_attendee_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events 
    SET attendee_count = (
      SELECT COUNT(*) 
      FROM public.event_rsvps 
      WHERE event_id = NEW.event_id AND status = 'going'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.events 
    SET attendee_count = (
      SELECT COUNT(*) 
      FROM public.event_rsvps 
      WHERE event_id = NEW.event_id AND status = 'going'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.events 
    SET attendee_count = (
      SELECT COUNT(*) 
      FROM public.event_rsvps 
      WHERE event_id = OLD.event_id AND status = 'going'
    )
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Add missing table for user security settings if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_security_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  password_changed_at timestamp with time zone DEFAULT now(),
  failed_login_attempts integer DEFAULT 0,
  account_locked_until timestamp with time zone,
  two_factor_enabled boolean DEFAULT false,
  security_questions_set boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on user_security_settings
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for user_security_settings
CREATE POLICY "Users can view their own security settings" 
  ON public.user_security_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own security settings" 
  ON public.user_security_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add missing table for community roles if it doesn't exist
CREATE TABLE IF NOT EXISTS public.community_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id uuid REFERENCES public.communities NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#99aab5',
  position integer DEFAULT 0,
  permissions jsonb DEFAULT '{}',
  can_moderate boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on community_roles
ALTER TABLE public.community_roles ENABLE ROW LEVEL SECURITY;

-- Create policy for community_roles
CREATE POLICY "Community roles viewable by members" 
  ON public.community_roles 
  FOR SELECT 
  USING (is_community_member(community_id, auth.uid()));

-- Add missing posts table if it doesn't exist (basic structure)
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  title text,
  content text NOT NULL,
  image_url text,
  post_type text DEFAULT 'text',
  tags text[] DEFAULT '{}',
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  saves_count integer DEFAULT 0,
  visibility text DEFAULT 'public',
  search_vector tsvector,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create comprehensive posts policies
CREATE POLICY "Posts are viewable by authenticated users" 
  ON public.posts 
  FOR SELECT 
  USING (
    CASE 
      WHEN visibility = 'public' THEN true
      WHEN visibility = 'private' THEN auth.uid() = user_id
      WHEN visibility = 'friends' THEN (
        auth.uid() = user_id OR 
        EXISTS (
          SELECT 1 FROM public.community_members cm1
          JOIN public.community_members cm2 ON cm1.community_id = cm2.community_id
          WHERE cm1.user_id = auth.uid() AND cm2.user_id = posts.user_id
        )
      )
      ELSE false
    END
  );

CREATE POLICY "Users can create their own posts" 
  ON public.posts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
  ON public.posts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
  ON public.posts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add missing event_rsvps table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES public.events NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  status text DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on event_rsvps
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Create policies for event_rsvps
CREATE POLICY "Users can manage their own RSVPs" 
  ON public.event_rsvps 
  FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Event RSVPs are viewable by event attendees" 
  ON public.event_rsvps 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_rsvps.event_id 
      AND (e.is_public = true OR e.created_by = auth.uid())
    )
  );
