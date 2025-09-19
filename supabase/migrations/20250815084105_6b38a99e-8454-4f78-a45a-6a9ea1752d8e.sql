
-- Fix public data exposure by updating RLS policies to require authentication

-- 1. Update posts table to require authentication for viewing
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by authenticated users" 
  ON public.posts 
  FOR SELECT 
  TO authenticated
  USING (true);

-- 2. Update comments table to require authentication for viewing  
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by authenticated users" 
  ON public.comments 
  FOR SELECT 
  TO authenticated
  USING (true);

-- 3. Update hashtags table to require authentication for viewing
DROP POLICY IF EXISTS "Hashtags are visible to everyone" ON public.hashtags;
CREATE POLICY "Hashtags are visible to authenticated users" 
  ON public.hashtags 
  FOR SELECT 
  TO authenticated
  USING (true);

-- 4. Update post_hashtags table to require authentication for viewing
DROP POLICY IF EXISTS "Post hashtags are visible to everyone" ON public.post_hashtags;
CREATE POLICY "Post hashtags are visible to authenticated users" 
  ON public.post_hashtags 
  FOR SELECT 
  TO authenticated
  USING (true);

-- 5. Update post_mentions table to require authentication for viewing
DROP POLICY IF EXISTS "Post mentions are visible to everyone" ON public.post_mentions;
CREATE POLICY "Post mentions are visible to authenticated users" 
  ON public.post_mentions 
  FOR SELECT 
  TO authenticated
  USING (true);

-- 6. Update trending_topics table to require authentication for viewing
DROP POLICY IF EXISTS "Trending topics are publicly viewable" ON public.trending_topics;
CREATE POLICY "Trending topics are viewable by authenticated users" 
  ON public.trending_topics 
  FOR SELECT 
  TO authenticated
  USING (true);

-- 7. Update communities table to hide private community details
DROP POLICY IF EXISTS "Communities are viewable by everyone" ON public.communities;
CREATE POLICY "Public communities are viewable by everyone" 
  ON public.communities 
  FOR SELECT 
  USING (NOT is_private);

CREATE POLICY "Private communities are viewable by members only" 
  ON public.communities 
  FOR SELECT 
  TO authenticated
  USING (is_private AND is_community_member(id, auth.uid()));

-- 8. Update communities_enhanced table to hide private community details
DROP POLICY IF EXISTS "Communities are viewable by everyone" ON public.communities_enhanced;
CREATE POLICY "Public enhanced communities are viewable by everyone" 
  ON public.communities_enhanced 
  FOR SELECT 
  USING (NOT is_private);

CREATE POLICY "Private enhanced communities are viewable by members only" 
  ON public.communities_enhanced 
  FOR SELECT 
  TO authenticated
  USING (is_private AND EXISTS (
    SELECT 1 FROM community_members 
    WHERE community_id = communities_enhanced.id 
    AND user_id = auth.uid()
  ));

-- 9. Fix function search_path issues by updating remaining functions
CREATE OR REPLACE FUNCTION public.update_hashtag_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

CREATE OR REPLACE FUNCTION public.increment_engagement_score(user_uuid uuid, points integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.profiles 
  SET engagement_score = engagement_score + points 
  WHERE user_id = user_uuid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_default_community_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Create admin role
  INSERT INTO public.community_roles (community_id, name, color, position, permissions)
  Values (NEW.id, 'Admin', '#ff4444', 100, '{"manage_channels": true, "manage_roles": true, "manage_members": true, "delete_messages": true}');
  
  -- Create moderator role  
  INSERT INTO public.community_roles (community_id, name, color, position, permissions)
  Values (NEW.id, 'Moderator', '#5865f2', 50, '{"delete_messages": true, "manage_members": true}');
  
  -- Create member role
  INSERT INTO public.community_roles (community_id, name, color, position, permissions)
  Values (NEW.id, 'Member', '#99aab5', 10, '{"send_messages": true, "read_messages": true}');
  
  -- Create general channel
  INSERT INTO public.community_channels (community_id, name, description, created_by, position)
  VALUES (NEW.id, 'general', 'General discussion', NEW.created_by, 0);
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_join_study_group_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.study_group_members (study_group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_typing_indicators()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  DELETE FROM public.typing_indicators 
  WHERE started_at < NOW() - INTERVAL '10 seconds';
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_event_attendee_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Add a new security function to get current user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$function$;
