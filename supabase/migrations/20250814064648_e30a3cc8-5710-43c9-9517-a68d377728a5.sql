
-- Add full-text search capabilities
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add full-text search columns to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create index for full-text search on posts
CREATE INDEX IF NOT EXISTS idx_posts_search_vector ON posts USING gin(search_vector);

-- Add full-text search to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_profiles_search_vector ON profiles USING gin(search_vector);

-- Add full-text search to communities
ALTER TABLE communities ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_communities_search_vector ON communities USING gin(search_vector);

-- Add full-text search to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_events_search_vector ON events USING gin(search_vector);

-- Create function to update search vectors
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create triggers for search vector updates
DROP TRIGGER IF EXISTS posts_search_vector_update ON posts;
CREATE TRIGGER posts_search_vector_update
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

DROP TRIGGER IF EXISTS profiles_search_vector_update ON profiles;
CREATE TRIGGER profiles_search_vector_update
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

DROP TRIGGER IF EXISTS communities_search_vector_update ON communities;
CREATE TRIGGER communities_search_vector_update
  BEFORE INSERT OR UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

DROP TRIGGER IF EXISTS events_search_vector_update ON events;
CREATE TRIGGER events_search_vector_update
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- Create trending topics table
CREATE TABLE IF NOT EXISTS trending_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL UNIQUE,
  mention_count INTEGER DEFAULT 1,
  last_mentioned TIMESTAMP WITH TIME ZONE DEFAULT now(),
  trend_score FLOAT DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for trending topics
CREATE INDEX IF NOT EXISTS idx_trending_topics_score ON trending_topics(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_topics_last_mentioned ON trending_topics(last_mentioned);

-- Expand post_reports table for category-based reporting
ALTER TABLE post_reports ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';
ALTER TABLE post_reports ADD COLUMN IF NOT EXISTS evidence_urls TEXT[];
ALTER TABLE post_reports ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'low';

-- Create user_reports table
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reported_user_id UUID NOT NULL,
  reported_by UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  reason TEXT NOT NULL,
  description TEXT,
  evidence_urls TEXT[],
  severity TEXT DEFAULT 'low',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  resolution_notes TEXT
);

-- Create community_reports table
CREATE TABLE IF NOT EXISTS community_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reported_community_id UUID NOT NULL,
  reported_by UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  reason TEXT NOT NULL,
  description TEXT,
  evidence_urls TEXT[],
  severity TEXT DEFAULT 'low',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  resolution_notes TEXT
);

-- Create moderation_actions table
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  moderator_id UUID NOT NULL,
  target_type TEXT NOT NULL, -- 'user', 'post', 'community', 'comment'
  target_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'warn', 'mute', 'ban', 'remove_content', 'suspend'
  reason TEXT NOT NULL,
  duration INTERVAL,
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reversed_at TIMESTAMP WITH TIME ZONE,
  reversed_by UUID,
  reversal_reason TEXT
);

-- Create automated_moderation_rules table
CREATE TABLE IF NOT EXISTS automated_moderation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'keyword', 'regex', 'ml_toxicity', 'spam_detection'
  pattern TEXT NOT NULL,
  action TEXT NOT NULL, -- 'flag', 'remove', 'shadowban'
  severity INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create content_flags table for automated moderation
CREATE TABLE IF NOT EXISTS content_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL, -- 'post', 'comment', 'message'
  content_id UUID NOT NULL,
  flag_type TEXT NOT NULL,
  confidence_score FLOAT DEFAULT 0.0,
  rule_id UUID REFERENCES automated_moderation_rules(id),
  auto_actioned BOOLEAN DEFAULT false,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for moderation tables
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_moderation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create user reports" ON user_reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can create community reports" ON community_reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- Only moderators can view reports and take actions
CREATE POLICY "Moderators can view user reports" ON user_reports
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
  ));

CREATE POLICY "Moderators can view community reports" ON community_reports
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
  ));

CREATE POLICY "Moderators can manage moderation actions" ON moderation_actions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
  ));

CREATE POLICY "Admins can manage moderation rules" ON automated_moderation_rules
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Moderators can view content flags" ON content_flags
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- Trending topics are publicly viewable
CREATE POLICY "Trending topics are publicly viewable" ON trending_topics
  FOR SELECT USING (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports(status);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON moderation_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_content_flags_content ON content_flags(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_flags_reviewed ON content_flags(reviewed, created_at);

-- Enable realtime for moderation
ALTER TABLE user_reports REPLICA IDENTITY FULL;
ALTER TABLE community_reports REPLICA IDENTITY FULL;
ALTER TABLE moderation_actions REPLICA IDENTITY FULL;
ALTER TABLE content_flags REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE user_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE community_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE moderation_actions;
ALTER PUBLICATION supabase_realtime ADD TABLE content_flags;
