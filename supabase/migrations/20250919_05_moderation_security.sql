-- Moderation and Security Migration (Part 5)

-- 1. Automated Moderation Rules
CREATE TABLE IF NOT EXISTS public.automated_moderation_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rule_type text NOT NULL,
  pattern text NOT NULL,
  action text NOT NULL,
  severity integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT automated_moderation_rules_pkey PRIMARY KEY (id),
  CONSTRAINT automated_moderation_rules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Content Flags
CREATE TABLE IF NOT EXISTS public.content_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  flag_type text NOT NULL,
  confidence_score double precision DEFAULT 0.0,
  rule_id uuid,
  auto_actioned boolean DEFAULT false,
  reviewed boolean DEFAULT false,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT content_flags_pkey PRIMARY KEY (id),
  CONSTRAINT content_flags_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.automated_moderation_rules(id) ON DELETE SET NULL,
  CONSTRAINT content_flags_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 3. Moderation Actions
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  moderator_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  action_type text NOT NULL,
  reason text NOT NULL,
  duration interval,
  expires_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  reversed_at timestamp with time zone,
  reversed_by uuid,
  reversal_reason text,
  CONSTRAINT moderation_actions_pkey PRIMARY KEY (id),
  CONSTRAINT moderation_actions_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT moderation_actions_reversed_by_fkey FOREIGN KEY (reversed_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4. Moderation Logs
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL,
  moderator_id uuid NOT NULL,
  target_user_id uuid,
  action text NOT NULL,
  reason text,
  duration integer,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT moderation_logs_pkey PRIMARY KEY (id),
  CONSTRAINT moderation_logs_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities_enhanced(id) ON DELETE CASCADE,
  CONSTRAINT moderation_logs_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT moderation_logs_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 5. Post Reports
CREATE TABLE IF NOT EXISTS public.post_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  reported_by uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text DEFAULT 'pending'::text CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  category text DEFAULT 'other'::text,
  evidence_urls text[] DEFAULT '{}',
  severity text DEFAULT 'low'::text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved_at timestamp with time zone,
  resolved_by uuid,
  resolution_notes text,
  CONSTRAINT post_reports_pkey PRIMARY KEY (id),
  CONSTRAINT post_reports_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
  CONSTRAINT post_reports_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT post_reports_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 6. User Reports
CREATE TABLE IF NOT EXISTS public.user_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reported_user_id uuid NOT NULL,
  reported_by uuid NOT NULL,
  category text NOT NULL DEFAULT 'other'::text,
  reason text NOT NULL,
  description text,
  evidence_urls text[] DEFAULT '{}',
  severity text DEFAULT 'low'::text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'pending'::text CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  resolved_by uuid,
  resolution_notes text,
  CONSTRAINT user_reports_pkey PRIMARY KEY (id),
  CONSTRAINT user_reports_reported_user_id_fkey FOREIGN KEY (reported_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_reports_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_reports_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 7. Community Reports
CREATE TABLE IF NOT EXISTS public.community_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reported_community_id uuid NOT NULL,
  reported_by uuid NOT NULL,
  category text NOT NULL DEFAULT 'other'::text,
  reason text NOT NULL,
  description text,
  evidence_urls text[] DEFAULT '{}',
  severity text DEFAULT 'low'::text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'pending'::text CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  resolved_by uuid,
  resolution_notes text,
  CONSTRAINT community_reports_pkey PRIMARY KEY (id),
  CONSTRAINT community_reports_reported_community_id_fkey FOREIGN KEY (reported_community_id) REFERENCES public.communities_enhanced(id) ON DELETE CASCADE,
  CONSTRAINT community_reports_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT community_reports_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 8. User Blocks
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  blocked_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_blocks_pkey PRIMARY KEY (id),
  CONSTRAINT user_blocks_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_blocks_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_blocks_unique UNIQUE (blocker_id, blocked_id),
  CONSTRAINT user_blocks_no_self_block CHECK (blocker_id != blocked_id)
);

-- 9. User Security Settings
CREATE TABLE IF NOT EXISTS public.user_security_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  password_changed_at timestamp with time zone DEFAULT now(),
  failed_login_attempts integer DEFAULT 0,
  account_locked_until timestamp with time zone,
  two_factor_enabled boolean DEFAULT false,
  security_questions_set boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_security_settings_pkey PRIMARY KEY (id),
  CONSTRAINT user_security_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 10. Security Events
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT security_events_pkey PRIMARY KEY (id),
  CONSTRAINT security_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 11. Rate Limits
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action_type text NOT NULL,
  attempts integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rate_limits_pkey PRIMARY KEY (id)
);

-- 12. Compromised Passwords
CREATE TABLE IF NOT EXISTS public.compromised_passwords (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  password_hash text NOT NULL UNIQUE,
  reported_at timestamp with time zone DEFAULT now(),
  source text,
  CONSTRAINT compromised_passwords_pkey PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.automated_moderation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compromised_passwords ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_flags_content_type_id ON public.content_flags(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON public.moderation_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_community_id ON public.moderation_logs(community_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_post_id ON public.post_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_status ON public.post_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported_user_id ON public.user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON public.user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON public.user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier, action_type);
