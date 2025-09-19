-- Analytics and Notifications Migration (Part 6)

-- 1. Analytics Events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  metadata jsonb DEFAULT '{}',
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT analytics_events_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. User Analytics
CREATE TABLE IF NOT EXISTS public.user_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  session_id text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT user_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 3. Study Group Analytics
CREATE TABLE IF NOT EXISTS public.study_group_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  study_group_id uuid NOT NULL,
  metric_type text NOT NULL,
  metric_value jsonb NOT NULL DEFAULT '{}',
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  period_start timestamp with time zone,
  period_end timestamp with time zone,
  CONSTRAINT study_group_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT study_group_analytics_study_group_id_fkey FOREIGN KEY (study_group_id) REFERENCES public.study_groups(id) ON DELETE CASCADE
);

-- 4. User Achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_type text NOT NULL,
  achievement_data jsonb DEFAULT '{}',
  earned_at timestamp with time zone DEFAULT now(),
  is_visible boolean DEFAULT true,
  CONSTRAINT user_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 5. Push Notification Tokens
CREATE TABLE IF NOT EXISTS public.push_notification_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('web', 'android', 'ios')),
  created_at timestamp with time zone DEFAULT now(),
  last_used timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT push_notification_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT push_notification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT push_notification_tokens_unique UNIQUE (user_id, token)
);

-- 6. Mentorship Matches
CREATE TABLE IF NOT EXISTS public.mentorship_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL,
  mentee_id uuid NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  match_score integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT mentorship_matches_pkey PRIMARY KEY (id),
  CONSTRAINT mentorship_matches_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT mentorship_matches_mentee_id_fkey FOREIGN KEY (mentee_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT mentorship_matches_unique UNIQUE (mentor_id, mentee_id),
  CONSTRAINT mentorship_matches_no_self_match CHECK (mentor_id != mentee_id)
);

-- 7. KV Store (for caching and temporary data)
CREATE TABLE IF NOT EXISTS public.kv_store_2a876eaa (
  key text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  CONSTRAINT kv_store_2a876eaa_pkey PRIMARY KEY (key)
);

-- 8. Community Memberships (simplified version)
CREATE TABLE IF NOT EXISTS public.community_memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  community_id uuid NOT NULL,
  role text DEFAULT 'member'::text CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT community_memberships_pkey PRIMARY KEY (id),
  CONSTRAINT community_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT community_memberships_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities_enhanced(id) ON DELETE CASCADE,
  CONSTRAINT community_memberships_unique UNIQUE (user_id, community_id)
);

-- 9. Communities (legacy table for backward compatibility)
CREATE TABLE IF NOT EXISTS public.communities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  is_private boolean DEFAULT false,
  member_count integer DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  search_vector tsvector,
  CONSTRAINT communities_pkey PRIMARY KEY (id),
  CONSTRAINT communities_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 10. Servers (for Discord-like functionality)
CREATE TABLE IF NOT EXISTS public.servers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL,
  invite_code text DEFAULT encode(gen_random_bytes(8), 'hex'),
  is_public boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT servers_pkey PRIMARY KEY (id),
  CONSTRAINT servers_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT servers_invite_code_unique UNIQUE (invite_code)
);

-- 11. Server Members
CREATE TABLE IF NOT EXISTS public.server_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member'::text CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT server_members_pkey PRIMARY KEY (id),
  CONSTRAINT server_members_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE CASCADE,
  CONSTRAINT server_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT server_members_unique UNIQUE (server_id, user_id)
);

-- 12. Channels (for servers)
CREATE TABLE IF NOT EXISTS public.channels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'text'::text CHECK (type IN ('text', 'voice', 'category')),
  position integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  topic text,
  is_private boolean DEFAULT false,
  slowmode_seconds integer DEFAULT 0,
  CONSTRAINT channels_pkey PRIMARY KEY (id),
  CONSTRAINT channels_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kv_store_2a876eaa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON public.analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON public.user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON public.user_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_study_group_analytics_study_group_id ON public.study_group_analytics(study_group_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_push_notification_tokens_user_id ON public.push_notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_matches_mentor_id ON public.mentorship_matches(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_matches_mentee_id ON public.mentorship_matches(mentee_id);
CREATE INDEX IF NOT EXISTS idx_kv_store_expires_at ON public.kv_store_2a876eaa(expires_at);
CREATE INDEX IF NOT EXISTS idx_community_memberships_user_id ON public.community_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_community_memberships_community_id ON public.community_memberships(community_id);
CREATE INDEX IF NOT EXISTS idx_servers_owner_id ON public.servers(owner_id);
CREATE INDEX IF NOT EXISTS idx_server_members_server_id ON public.server_members(server_id);
CREATE INDEX IF NOT EXISTS idx_server_members_user_id ON public.server_members(user_id);
CREATE INDEX IF NOT EXISTS idx_channels_server_id ON public.channels(server_id);
