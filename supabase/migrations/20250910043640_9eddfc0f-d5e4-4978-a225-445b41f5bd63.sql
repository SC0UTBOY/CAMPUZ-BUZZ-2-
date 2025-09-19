-- Fix critical security issues identified in linter

-- 1. Fix search_path for functions that are missing it
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

-- Fix other critical functions
CREATE OR REPLACE FUNCTION public.increment_engagement_score(user_uuid uuid, points integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE profiles 
  SET engagement_score = engagement_score + points 
  WHERE user_id = user_uuid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_join_study_group_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO study_group_members (study_group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$function$;

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
    hashtag_names := extract_hashtags(NEW.content);
    
    -- Insert or update hashtags
    FOREACH hashtag_name IN ARRAY hashtag_names
    LOOP
        INSERT INTO hashtags (name, usage_count)
        VALUES (hashtag_name, 1)
        ON CONFLICT (name) 
        DO UPDATE SET usage_count = hashtags.usage_count + 1;
        
        -- Link hashtag to post
        INSERT INTO post_hashtags (post_id, hashtag_id)
        SELECT NEW.id, h.id
        FROM hashtags h
        WHERE h.name = hashtag_name
        ON CONFLICT (post_id, hashtag_id) DO NOTHING;
    END LOOP;
    
    RETURN NEW;
END;
$function$;

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

-- 2. Add proper RLS policy for post_reactions to fix security warning
DROP POLICY IF EXISTS "Users can manage their own reactions" ON post_reactions;

CREATE POLICY "Users can manage their own reactions" 
ON post_reactions 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view reactions on posts they can access"
ON post_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM posts p
    WHERE p.id = post_reactions.post_id
    AND (
      p.user_id = auth.uid() 
      OR 
      EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = p.community_id 
        AND cm.user_id = auth.uid()
      )
      OR p.visibility = 'public'
    )
  )
);

-- 3. Remove the communities_enhanced table issue by creating a proper view
DROP VIEW IF EXISTS communities_enhanced;

CREATE VIEW communities_enhanced AS
SELECT 
  c.*,
  COALESCE(c.name, 'Unnamed Community') as name,
  CASE WHEN c.is_private THEN 
    md5(random()::text || clock_timestamp()::text)::uuid::text
  ELSE NULL END as invite_code
FROM communities c;

-- Enable RLS on the view (if supported) or rely on underlying table RLS
COMMENT ON VIEW communities_enhanced IS 'Enhanced community view with computed fields';

-- 4. Enable realtime for critical tables
ALTER TABLE posts REPLICA IDENTITY FULL;
ALTER TABLE comments REPLICA IDENTITY FULL;
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE post_reactions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE post_reactions;