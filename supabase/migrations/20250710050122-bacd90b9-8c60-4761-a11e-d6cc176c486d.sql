-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  major TEXT,
  department TEXT,
  year TEXT,
  role TEXT DEFAULT 'student',
  engagement_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create communities table
CREATE TABLE public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_private BOOLEAN DEFAULT false,
  member_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  community_id UUID,
  title TEXT,
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'text',
  poll_options JSONB,
  tags TEXT[],
  image_url TEXT,
  file_url TEXT,
  file_name TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community memberships table
CREATE TABLE public.community_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  community_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, community_id)
);

-- Create mentorship matches table
CREATE TABLE public.mentorship_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL,
  mentee_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  match_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post reports table
CREATE TABLE public.post_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  reported_by UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create likes table
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID,
  comment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for communities
CREATE POLICY "Communities are viewable by everyone" 
ON public.communities FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create communities" 
ON public.communities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Create policies for posts
CREATE POLICY "Posts are viewable by everyone" 
ON public.posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" 
ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON public.posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Create policies for comments
CREATE POLICY "Comments are viewable by everyone" 
ON public.comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.comments FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for community memberships
CREATE POLICY "Community memberships are viewable by everyone" 
ON public.community_memberships FOR SELECT USING (true);

CREATE POLICY "Users can join communities" 
ON public.community_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities" 
ON public.community_memberships FOR DELETE USING (auth.uid() = user_id);

-- Create policies for likes
CREATE POLICY "Likes are viewable by everyone" 
ON public.likes FOR SELECT USING (true);

CREATE POLICY "Users can like posts/comments" 
ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts/comments" 
ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Create policies for mentorship matches
CREATE POLICY "Users can view their mentorship matches" 
ON public.mentorship_matches FOR SELECT USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- Create policies for post reports (admin only for viewing)
CREATE POLICY "Users can report posts" 
ON public.post_reports FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment engagement score
CREATE OR REPLACE FUNCTION public.increment_engagement_score(user_uuid UUID, points INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET engagement_score = engagement_score + points 
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate AI study suggestions
CREATE OR REPLACE FUNCTION public.get_study_suggestions(user_uuid UUID)
RETURNS TABLE (
  suggestion_type TEXT,
  title TEXT,
  description TEXT,
  relevance_score INTEGER
) AS $$
BEGIN
  -- This is a mock function that would normally call an AI service
  RETURN QUERY
  SELECT 
    'topic'::TEXT as suggestion_type,
    'Advanced React Patterns'::TEXT as title,
    'Based on your Computer Science major and recent posts about React'::TEXT as description,
    95::INTEGER as relevance_score
  UNION ALL
  SELECT 
    'group'::TEXT,
    'Study Group: Data Structures'::TEXT,
    'Join this active study group with students from your major'::TEXT,
    88::INTEGER
  UNION ALL
  SELECT 
    'post'::TEXT,
    'How to ace CS 101 midterms'::TEXT,
    'Popular post from senior students in your department'::TEXT,
    82::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for key tables
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.likes REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;