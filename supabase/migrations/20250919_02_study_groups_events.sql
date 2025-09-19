-- Study Groups and Events Migration (Part 2)

-- 1. Study Groups
CREATE TABLE IF NOT EXISTS public.study_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  subject text NOT NULL,
  is_private boolean DEFAULT false,
  max_members integer DEFAULT 10,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  tags text[] DEFAULT '{}',
  location text,
  meeting_schedule jsonb DEFAULT '{}',
  CONSTRAINT study_groups_pkey PRIMARY KEY (id),
  CONSTRAINT study_groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Study Group Members
CREATE TABLE IF NOT EXISTS public.study_group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  study_group_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member'::text CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT study_group_members_pkey PRIMARY KEY (id),
  CONSTRAINT study_group_members_study_group_id_fkey FOREIGN KEY (study_group_id) REFERENCES public.study_groups(id) ON DELETE CASCADE,
  CONSTRAINT study_group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT study_group_members_unique UNIQUE (study_group_id, user_id)
);

-- 3. Study Sessions
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  study_group_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  scheduled_at timestamp with time zone NOT NULL,
  duration_minutes integer DEFAULT 60,
  location text,
  is_virtual boolean DEFAULT false,
  meeting_link text,
  max_participants integer,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT study_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT study_sessions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT study_sessions_study_group_id_fkey FOREIGN KEY (study_group_id) REFERENCES public.study_groups(id) ON DELETE CASCADE
);

-- 4. Session Participants
CREATE TABLE IF NOT EXISTS public.session_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'registered'::text CHECK (status IN ('registered', 'attended', 'missed', 'cancelled')),
  joined_at timestamp with time zone DEFAULT now(),
  left_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT session_participants_pkey PRIMARY KEY (id),
  CONSTRAINT session_participants_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.study_sessions(id) ON DELETE CASCADE,
  CONSTRAINT session_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT session_participants_unique UNIQUE (session_id, user_id)
);

-- 5. Study Materials
CREATE TABLE IF NOT EXISTS public.study_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  study_group_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  tags text[] DEFAULT '{}',
  is_public boolean DEFAULT true,
  download_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT study_materials_pkey PRIMARY KEY (id),
  CONSTRAINT study_materials_study_group_id_fkey FOREIGN KEY (study_group_id) REFERENCES public.study_groups(id) ON DELETE CASCADE,
  CONSTRAINT study_materials_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 6. Events
CREATE TABLE IF NOT EXISTS public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  community_id uuid,
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  event_type text DEFAULT 'study_session'::text CHECK (event_type IN ('study_session', 'workshop', 'social', 'meeting', 'other')),
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  location text,
  is_virtual boolean DEFAULT false,
  meeting_link text,
  max_attendees integer,
  is_public boolean DEFAULT true,
  tags text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  attendee_count integer DEFAULT 0,
  google_calendar_id text,
  outlook_calendar_id text,
  search_vector tsvector,
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities_enhanced(id) ON DELETE SET NULL,
  CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 7. Event RSVPs
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text DEFAULT 'going'::text CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_rsvps_pkey PRIMARY KEY (id),
  CONSTRAINT event_rsvps_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE,
  CONSTRAINT event_rsvps_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT event_rsvps_unique UNIQUE (event_id, user_id)
);

-- 8. Event Notifications
CREATE TABLE IF NOT EXISTS public.event_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('reminder_24h', 'reminder_1h', 'reminder_15m', 'event_updated', 'event_cancelled')),
  scheduled_for timestamp with time zone NOT NULL,
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT event_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT event_notifications_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE,
  CONSTRAINT event_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_notifications ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_study_groups_created_by ON public.study_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_study_group_members_study_group_id ON public.study_group_members(study_group_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user_id ON public.study_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_study_group_id ON public.study_sessions(study_group_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_scheduled_at ON public.study_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON public.session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_study_group_id ON public.study_materials(study_group_id);
CREATE INDEX IF NOT EXISTS idx_events_community_id ON public.events(community_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON public.event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON public.event_rsvps(user_id);
