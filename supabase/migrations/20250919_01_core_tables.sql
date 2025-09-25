-- Core Tables Migration (Part 1)
-- This creates the foundational tables that other tables depend on

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  major text,
  department text,
  year text,
  role text DEFAULT 'student'::text,
  engagement_score integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  school text,
  gpa numeric,
  graduation_year integer,
  skills text[] DEFAULT '{}',
  interests text[] DEFAULT '{}',
  social_links jsonb DEFAULT '{}',
  privacy_settings jsonb DEFAULT '{"email_visible": false, "profile_visible": true, "academic_info_visible": true}',
  search_vector tsvector,
  username text,
  avatar text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Communities Enhanced
CREATE TABLE IF NOT EXISTS public.communities_enhanced (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar_url text,
  banner_url text,
  invite_code text DEFAULT encode(gen_random_bytes(8), 'hex') UNIQUE,
  is_private boolean DEFAULT false,
  member_count integer DEFAULT 0,
  welcome_message text,
  rules text,
  slow_mode_seconds integer DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT communities_enhanced_pkey PRIMARY KEY (id),
  CONSTRAINT communities_enhanced_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. Posts table (updated with all fields)
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  community_id uuid,
  title text,
  content text NOT NULL,
  post_type text DEFAULT 'text'::text CHECK (post_type IN ('text', 'image', 'video', 'poll')),
  poll_options jsonb,
  tags text[] DEFAULT '{}',
  image_url text,
  file_url text,
  file_name text,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  reactions jsonb DEFAULT '{}',
  shares_count integer DEFAULT 0,
  saves_count integer DEFAULT 0,
  visibility text DEFAULT 'public'::text CHECK (visibility IN ('public', 'private', 'community')),
  search_vector tsvector,
  hashtags text[] DEFAULT '{}',
  mentions text[] DEFAULT '{}',
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT posts_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities_enhanced(id) ON DELETE SET NULL
);

-- 4. Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  likes_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  parent_id uuid,
  reactions jsonb DEFAULT '{}',
  depth integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE
);

-- 5. Likes table (unified for posts and comments)
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid,
  comment_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT likes_pkey PRIMARY KEY (id),
  CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
  CONSTRAINT likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE,
  CONSTRAINT likes_post_or_comment_check CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL)),
  CONSTRAINT likes_user_post_unique UNIQUE (user_id, post_id),
  CONSTRAINT likes_user_comment_unique UNIQUE (user_id, comment_id)
);

-- 6. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON public.posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON public.likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
