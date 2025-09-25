-- Community Features Migration (Part 4)

-- 1. Community Members
CREATE TABLE IF NOT EXISTS public.community_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL,
  user_id uuid NOT NULL,
  nickname text,
  roles uuid[] DEFAULT '{}',
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  muted_until timestamp with time zone,
  banned boolean DEFAULT false,
  CONSTRAINT community_members_pkey PRIMARY KEY (id),
  CONSTRAINT community_members_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities_enhanced(id) ON DELETE CASCADE,
  CONSTRAINT community_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT community_members_unique UNIQUE (community_id, user_id)
);

-- 2. Community Roles
CREATE TABLE IF NOT EXISTS public.community_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#99AAB5'::text,
  position integer DEFAULT 0,
  permissions jsonb DEFAULT '{}',
  mentionable boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  can_create_posts boolean DEFAULT true,
  can_moderate boolean DEFAULT false,
  can_manage_events boolean DEFAULT false,
  can_invite_members boolean DEFAULT false,
  CONSTRAINT community_roles_pkey PRIMARY KEY (id),
  CONSTRAINT community_roles_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities_enhanced(id) ON DELETE CASCADE
);

-- 3. Community Announcements
CREATE TABLE IF NOT EXISTS public.community_announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL,
  author_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  priority text DEFAULT 'normal'::text CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_pinned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_announcements_pkey PRIMARY KEY (id),
  CONSTRAINT community_announcements_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities_enhanced(id) ON DELETE CASCADE,
  CONSTRAINT community_announcements_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 4. Custom Emojis
CREATE TABLE IF NOT EXISTS public.custom_emojis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL,
  name text NOT NULL,
  image_url text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT custom_emojis_pkey PRIMARY KEY (id),
  CONSTRAINT custom_emojis_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities_enhanced(id) ON DELETE CASCADE,
  CONSTRAINT custom_emojis_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT custom_emojis_unique UNIQUE (community_id, name)
);

-- 5. Voice Sessions
CREATE TABLE IF NOT EXISTS public.voice_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL,
  session_id text NOT NULL,
  participants uuid[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  started_by uuid NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  CONSTRAINT voice_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT voice_sessions_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.community_channels(id) ON DELETE CASCADE,
  CONSTRAINT voice_sessions_started_by_fkey FOREIGN KEY (started_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 6. Hashtags
CREATE TABLE IF NOT EXISTS public.hashtags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  usage_count integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hashtags_pkey PRIMARY KEY (id)
);

-- 7. Post Hashtags (junction table)
CREATE TABLE IF NOT EXISTS public.post_hashtags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  hashtag_id uuid NOT NULL,
  CONSTRAINT post_hashtags_pkey PRIMARY KEY (id),
  CONSTRAINT post_hashtags_hashtag_id_fkey FOREIGN KEY (hashtag_id) REFERENCES public.hashtags(id) ON DELETE CASCADE,
  CONSTRAINT post_hashtags_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
  CONSTRAINT post_hashtags_unique UNIQUE (post_id, hashtag_id)
);

-- 8. Post Mentions
CREATE TABLE IF NOT EXISTS public.post_mentions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  mentioned_user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT post_mentions_pkey PRIMARY KEY (id),
  CONSTRAINT post_mentions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
  CONSTRAINT post_mentions_mentioned_user_id_fkey FOREIGN KEY (mentioned_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT post_mentions_unique UNIQUE (post_id, mentioned_user_id)
);

-- 9. Post Reactions
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT post_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT post_reactions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
  CONSTRAINT post_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT post_reactions_unique UNIQUE (post_id, user_id, reaction_type)
);

-- 10. Post Saves
CREATE TABLE IF NOT EXISTS public.post_saves (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT post_saves_pkey PRIMARY KEY (id),
  CONSTRAINT post_saves_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
  CONSTRAINT post_saves_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT post_saves_unique UNIQUE (post_id, user_id)
);

-- 11. Trending Topics
CREATE TABLE IF NOT EXISTS public.trending_topics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  topic text NOT NULL UNIQUE,
  mention_count integer DEFAULT 1,
  last_mentioned timestamp with time zone DEFAULT now(),
  trend_score double precision DEFAULT 0.0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT trending_topics_pkey PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_emojis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_topics ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON public.community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_roles_community_id ON public.community_roles(community_id);
CREATE INDEX IF NOT EXISTS idx_community_announcements_community_id ON public.community_announcements(community_id);
CREATE INDEX IF NOT EXISTS idx_custom_emojis_community_id ON public.custom_emojis(community_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_channel_id ON public.voice_sessions(channel_id);
CREATE INDEX IF NOT EXISTS idx_hashtags_name ON public.hashtags(name);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_id ON public.post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_id ON public.post_hashtags(hashtag_id);
CREATE INDEX IF NOT EXISTS idx_post_mentions_post_id ON public.post_mentions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_mentions_mentioned_user_id ON public.post_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_post_id ON public.post_saves(post_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_user_id ON public.post_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_trending_topics_trend_score ON public.trending_topics(trend_score DESC);
