
-- Database Audit and Integrity Fixes
-- This migration addresses multiple schema issues found during the audit

-- 1. Add missing foreign key constraints for data integrity
ALTER TABLE public.posts 
ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.posts 
ADD CONSTRAINT posts_community_id_fkey 
FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE SET NULL;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_parent_id_fkey 
FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE;

ALTER TABLE public.likes 
ADD CONSTRAINT likes_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.likes 
ADD CONSTRAINT likes_comment_id_fkey 
FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;

ALTER TABLE public.likes 
ADD CONSTRAINT likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.post_saves 
ADD CONSTRAINT post_saves_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.post_saves 
ADD CONSTRAINT post_saves_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.post_reactions 
ADD CONSTRAINT post_reactions_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.post_reactions 
ADD CONSTRAINT post_reactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 2. Add missing tables for complete functionality
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  post_type TEXT NOT NULL DEFAULT 'text',
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  visibility TEXT DEFAULT 'public',
  community_id UUID,
  file_name TEXT,
  file_url TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  reactions JSONB DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  mentions TEXT[] DEFAULT '{}',
  search_vector TSVECTOR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  is_virtual BOOLEAN DEFAULT FALSE,
  meeting_link TEXT,
  max_attendees INTEGER,
  attendee_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  event_type TEXT DEFAULT 'other',
  tags TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL,
  community_id UUID,
  image_url TEXT,
  google_calendar_id TEXT,
  outlook_calendar_id TEXT,
  search_vector TSVECTOR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'going',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.event_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.typing_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_id UUID,
  dm_conversation_id UUID,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Add proper constraints and indexes for performance
ALTER TABLE public.posts 
ADD CONSTRAINT posts_post_type_check 
CHECK (post_type IN ('text', 'image', 'video', 'poll'));

ALTER TABLE public.posts 
ADD CONSTRAINT posts_visibility_check 
CHECK (visibility IN ('public', 'friends', 'private'));

ALTER TABLE public.events 
ADD CONSTRAINT events_end_after_start_check 
CHECK (end_time > start_time);

ALTER TABLE public.event_rsvps 
ADD CONSTRAINT event_rsvps_status_check 
CHECK (status IN ('going', 'maybe', 'not_going'));

-- 4. Create essential indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON public.posts(community_id) WHERE community_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON public.posts(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_search_vector ON public.posts USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id) WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON public.likes(comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_community_id ON public.events(community_id) WHERE community_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_search_vector ON public.events USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON public.event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON public.event_rsvps(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON public.community_members(community_id);

CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.messages(channel_id) WHERE channel_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_dm_conversation_id ON public.messages(dm_conversation_id) WHERE dm_conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- 5. Add foreign key constraints for events and notifications
ALTER TABLE public.events 
ADD CONSTRAINT events_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.events 
ADD CONSTRAINT events_community_id_fkey 
FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE SET NULL;

ALTER TABLE public.event_rsvps 
ADD CONSTRAINT event_rsvps_event_id_fkey 
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.event_rsvps 
ADD CONSTRAINT event_rsvps_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.event_notifications 
ADD CONSTRAINT event_notifications_event_id_fkey 
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.event_notifications 
ADD CONSTRAINT event_notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 6. Enable RLS on new tables
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for new tables
CREATE POLICY "Posts are viewable by everyone" 
ON public.posts FOR SELECT 
USING (visibility = 'public' OR user_id = auth.uid());

CREATE POLICY "Users can create their own posts" 
ON public.posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON public.posts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON public.posts FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Public events are viewable by everyone" 
ON public.events FOR SELECT 
USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create events" 
ON public.events FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Event creators can update their events" 
ON public.events FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can RSVP to events" 
ON public.event_rsvps FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- 8. Create triggers for maintaining counts
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'likes' AND NEW.post_id IS NOT NULL THEN
      UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'comments' THEN
      UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'post_saves' THEN
      UPDATE posts SET saves_count = saves_count + 1 WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'likes' AND OLD.post_id IS NOT NULL THEN
      UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'comments' THEN
      UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'post_saves' THEN
      UPDATE posts SET saves_count = GREATEST(0, saves_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_post_likes_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

CREATE TRIGGER update_post_comments_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

CREATE TRIGGER update_post_saves_count
  AFTER INSERT OR DELETE ON public.post_saves
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- 9. Enable realtime for key tables
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.likes REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.typing_status REPLICA IDENTITY FULL;
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER TABLE public.event_rsvps REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_rsvps;

-- 10. Create updated_at triggers for timestamp management
CREATE TRIGGER set_updated_at_posts
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_events
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Create search vector update triggers
CREATE TRIGGER update_posts_search_vector
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

CREATE TRIGGER update_events_search_vector
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();
