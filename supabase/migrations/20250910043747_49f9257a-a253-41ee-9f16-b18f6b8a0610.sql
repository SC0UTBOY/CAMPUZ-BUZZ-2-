-- Fix the communities_enhanced table issue and other critical problems

-- 1. Fix search_path for remaining functions
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
      INSERT INTO study_group_analytics (study_group_id, metric_type, metric_value)
      VALUES (NEW.study_group_id, 'member_joined', jsonb_build_object('user_id', NEW.user_id, 'role', NEW.role));
    -- Record session creation
    ELSIF TG_TABLE_NAME = 'study_sessions' THEN
      INSERT INTO study_group_analytics (study_group_id, metric_type, metric_value)
      VALUES (NEW.study_group_id, 'session_created', jsonb_build_object('session_id', NEW.id, 'title', NEW.title));
    -- Record material upload
    ELSIF TG_TABLE_NAME = 'study_materials' THEN
      INSERT INTO study_group_analytics (study_group_id, metric_type, metric_value)
      VALUES (NEW.study_group_id, 'material_uploaded', jsonb_build_object('material_id', NEW.id, 'title', NEW.title, 'uploaded_by', NEW.uploaded_by));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_default_community_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Create admin role
  INSERT INTO community_roles (community_id, name, color, position, permissions)
  Values (NEW.id, 'Admin', '#ff4444', 100, '{"manage_channels": true, "manage_roles": true, "manage_members": true, "delete_messages": true}');
  
  -- Create moderator role  
  INSERT INTO community_roles (community_id, name, color, position, permissions)
  Values (NEW.id, 'Moderator', '#5865f2', 50, '{"delete_messages": true, "manage_members": true}');
  
  -- Create member role
  INSERT INTO community_roles (community_id, name, color, position, permissions)
  Values (NEW.id, 'Member', '#99aab5', 10, '{"send_messages": true, "read_messages": true}');
  
  -- Create general channel
  INSERT INTO community_channels (community_id, name, description, created_by, position)
  VALUES (NEW.id, 'general', 'General discussion', NEW.created_by, 0);
  
  RETURN NEW;
END;
$function$;

-- 2. Enable realtime for critical tables
ALTER TABLE posts REPLICA IDENTITY FULL;
ALTER TABLE comments REPLICA IDENTITY FULL;
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE post_reactions REPLICA IDENTITY FULL;

-- Add tables to realtime publication  
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE post_reactions;