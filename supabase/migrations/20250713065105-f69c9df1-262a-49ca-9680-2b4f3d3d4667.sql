
-- Enhanced posts table with reactions and better structure
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS shares_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS saves_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'community'));

-- Comments threading and reactions
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id),
ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS depth integer DEFAULT 0;

-- Post reactions table
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Post saves table
CREATE TABLE IF NOT EXISTS public.post_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enhanced profiles with academic info
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS school text,
ADD COLUMN IF NOT EXISTS gpa decimal(3,2),
ADD COLUMN IF NOT EXISTS graduation_year integer,
ADD COLUMN IF NOT EXISTS skills text[],
ADD COLUMN IF NOT EXISTS interests text[],
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS privacy_settings jsonb DEFAULT '{"profile_visible": true, "email_visible": false, "academic_info_visible": true}';

-- User achievements/badges
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_type text NOT NULL,
  achievement_data jsonb DEFAULT '{}',
  earned_at timestamp with time zone DEFAULT now(),
  is_visible boolean DEFAULT true
);

-- Enhanced community roles and permissions
ALTER TABLE public.community_roles 
ADD COLUMN IF NOT EXISTS can_create_posts boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS can_moderate boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_events boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_invite_members boolean DEFAULT false;

-- Community announcements
CREATE TABLE IF NOT EXISTS public.community_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES public.communities_enhanced(id) ON DELETE CASCADE NOT NULL,
  author_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_pinned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Events system
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES public.communities_enhanced(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  event_type text DEFAULT 'study_session' CHECK (event_type IN ('study_session', 'workshop', 'social', 'meeting', 'other')),
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  location text,
  is_virtual boolean DEFAULT false,
  meeting_link text,
  max_attendees integer,
  is_public boolean DEFAULT true,
  tags text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RSVPs for events
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  status text DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Hashtags system
CREATE TABLE IF NOT EXISTS public.hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  usage_count integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now()
);

-- Post hashtags junction
CREATE TABLE IF NOT EXISTS public.post_hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  hashtag_id uuid REFERENCES public.hashtags(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(post_id, hashtag_id)
);

-- User mentions in posts
CREATE TABLE IF NOT EXISTS public.post_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  mentioned_user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(post_id, mentioned_user_id)
);

-- RLS Policies
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post reactions
CREATE POLICY "Post reactions are visible to everyone" ON public.post_reactions FOR SELECT USING (true);
CREATE POLICY "Users can manage their own reactions" ON public.post_reactions FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for post saves
CREATE POLICY "Users can manage their own saves" ON public.post_saves FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for achievements
CREATE POLICY "Achievements are visible to everyone" ON public.user_achievements FOR SELECT USING (is_visible = true);
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for community announcements
CREATE POLICY "Community announcements are visible to members" ON public.community_announcements FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.community_members 
  WHERE community_id = community_announcements.community_id 
  AND user_id = auth.uid()
));
CREATE POLICY "Community moderators can manage announcements" ON public.community_announcements FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.community_members cm
  JOIN public.community_roles cr ON cr.id = ANY(cm.roles)
  WHERE cm.community_id = community_announcements.community_id 
  AND cm.user_id = auth.uid()
  AND cr.can_moderate = true
));

-- RLS Policies for events
CREATE POLICY "Public events are visible to everyone" ON public.events FOR SELECT USING (is_public = true);
CREATE POLICY "Community events are visible to members" ON public.events FOR SELECT 
USING (community_id IS NULL OR EXISTS (
  SELECT 1 FROM public.community_members 
  WHERE community_id = events.community_id 
  AND user_id = auth.uid()
));
CREATE POLICY "Users can create events" ON public.events FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Event creators can update their events" ON public.events FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for event RSVPs
CREATE POLICY "Event RSVPs are visible to event attendees" ON public.event_rsvps FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.events e 
  WHERE e.id = event_rsvps.event_id 
  AND (e.is_public = true OR e.created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.event_rsvps er WHERE er.event_id = e.id AND er.user_id = auth.uid()
  ))
));
CREATE POLICY "Users can manage their own RSVPs" ON public.event_rsvps FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for hashtags
CREATE POLICY "Hashtags are visible to everyone" ON public.hashtags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create hashtags" ON public.hashtags FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for post hashtags
CREATE POLICY "Post hashtags are visible to everyone" ON public.post_hashtags FOR SELECT USING (true);
CREATE POLICY "Post authors can manage hashtags" ON public.post_hashtags FOR ALL 
USING (EXISTS (SELECT 1 FROM public.posts WHERE id = post_hashtags.post_id AND user_id = auth.uid()));

-- RLS Policies for post mentions
CREATE POLICY "Post mentions are visible to everyone" ON public.post_mentions FOR SELECT USING (true);
CREATE POLICY "Post authors can create mentions" ON public.post_mentions FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.posts WHERE id = post_mentions.post_id AND user_id = auth.uid()));

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_community_announcements_updated_at BEFORE UPDATE ON public.community_announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for hashtag management
CREATE OR REPLACE FUNCTION public.extract_hashtags(content text)
RETURNS text[]
LANGUAGE plpgsql
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

-- Function to update hashtag usage
CREATE OR REPLACE FUNCTION public.update_hashtag_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
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

-- Trigger to automatically extract hashtags from posts
CREATE TRIGGER extract_post_hashtags
    AFTER INSERT ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_hashtag_usage();
