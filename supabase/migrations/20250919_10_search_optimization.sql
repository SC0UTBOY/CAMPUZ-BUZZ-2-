-- Search and Performance Optimization Migration (Part 10)

-- Create full-text search indexes and functions

-- Function to update search vectors for profiles
CREATE OR REPLACE FUNCTION update_profile_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.display_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.username, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.major, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.department, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.skills, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.interests, ' '), '')), 'C');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update search vectors for posts
CREATE OR REPLACE FUNCTION update_post_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.hashtags, ' '), '')), 'C');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update search vectors for events
CREATE OR REPLACE FUNCTION update_event_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.event_type, '')), 'C');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update search vectors for communities
CREATE OR REPLACE FUNCTION update_community_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.welcome_message, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.rules, '')), 'D');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for search vector updates
CREATE TRIGGER update_profiles_search_vector
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_profile_search_vector();

CREATE TRIGGER update_posts_search_vector
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_post_search_vector();

CREATE TRIGGER update_events_search_vector
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_event_search_vector();

CREATE TRIGGER update_communities_search_vector
  BEFORE INSERT OR UPDATE ON public.communities_enhanced
  FOR EACH ROW EXECUTE FUNCTION update_community_search_vector();

-- Create GIN indexes for full-text search
CREATE INDEX IF NOT EXISTS idx_profiles_search_vector ON public.profiles USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_posts_search_vector ON public.posts USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_events_search_vector ON public.events USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_communities_search_vector ON public.communities_enhanced USING GIN(search_vector);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON public.posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_community_created ON public.posts(community_id, created_at DESC) WHERE community_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_visibility_created ON public.posts(visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON public.comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_user_created ON public.likes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time) WHERE start_time > now();
CREATE INDEX IF NOT EXISTS idx_study_groups_subject ON public.study_groups(subject, is_private);

-- Create partial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_public_recent ON public.posts(created_at DESC) 
  WHERE visibility = 'public';

CREATE INDEX IF NOT EXISTS idx_events_public_upcoming ON public.events(start_time) 
  WHERE is_public = true AND start_time > now();

CREATE INDEX IF NOT EXISTS idx_communities_public ON public.communities_enhanced(created_at DESC) 
  WHERE is_private = false;

CREATE INDEX IF NOT EXISTS idx_study_groups_public ON public.study_groups(created_at DESC) 
  WHERE is_private = false;

-- Function for advanced search across multiple tables
CREATE OR REPLACE FUNCTION search_all(
  search_query TEXT,
  search_type TEXT DEFAULT 'all',
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  result_type TEXT,
  result_id UUID,
  title TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (
    -- Search profiles
    SELECT 
      'profile'::TEXT as result_type,
      p.id as result_id,
      COALESCE(p.display_name, p.username) as title,
      p.bio as content,
      p.created_at,
      ts_rank(p.search_vector, plainto_tsquery('english', search_query)) as rank
    FROM public.profiles p
    WHERE (search_type = 'all' OR search_type = 'profiles')
      AND p.search_vector @@ plainto_tsquery('english', search_query)
      AND p.privacy_settings->>'profile_visible' = 'true'
    
    UNION ALL
    
    -- Search posts
    SELECT 
      'post'::TEXT as result_type,
      p.id as result_id,
      COALESCE(p.title, LEFT(p.content, 100)) as title,
      p.content,
      p.created_at,
      ts_rank(p.search_vector, plainto_tsquery('english', search_query)) as rank
    FROM public.posts p
    WHERE (search_type = 'all' OR search_type = 'posts')
      AND p.search_vector @@ plainto_tsquery('english', search_query)
      AND p.visibility = 'public'
    
    UNION ALL
    
    -- Search events
    SELECT 
      'event'::TEXT as result_type,
      e.id as result_id,
      e.title,
      e.description as content,
      e.created_at,
      ts_rank(e.search_vector, plainto_tsquery('english', search_query)) as rank
    FROM public.events e
    WHERE (search_type = 'all' OR search_type = 'events')
      AND e.search_vector @@ plainto_tsquery('english', search_query)
      AND e.is_public = true
      AND e.start_time > now()
    
    UNION ALL
    
    -- Search communities
    SELECT 
      'community'::TEXT as result_type,
      c.id as result_id,
      c.name as title,
      c.description as content,
      c.created_at,
      ts_rank(c.search_vector, plainto_tsquery('english', search_query)) as rank
    FROM public.communities_enhanced c
    WHERE (search_type = 'all' OR search_type = 'communities')
      AND c.search_vector @@ plainto_tsquery('english', search_query)
      AND c.is_private = false
  ) combined_results
  ORDER BY rank DESC, created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending hashtags
CREATE OR REPLACE FUNCTION get_trending_hashtags(
  limit_count INTEGER DEFAULT 10,
  time_window INTERVAL DEFAULT '7 days'
)
RETURNS TABLE(
  hashtag_name TEXT,
  usage_count BIGINT,
  recent_usage BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.name as hashtag_name,
    h.usage_count::BIGINT,
    COUNT(ph.id)::BIGINT as recent_usage
  FROM public.hashtags h
  LEFT JOIN public.post_hashtags ph ON h.id = ph.hashtag_id
  LEFT JOIN public.posts p ON ph.post_id = p.id AND p.created_at > now() - time_window
  WHERE h.usage_count > 0
  GROUP BY h.id, h.name, h.usage_count
  ORDER BY recent_usage DESC, h.usage_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user activity feed
CREATE OR REPLACE FUNCTION get_user_feed(
  user_id_param UUID,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  post_id UUID,
  title TEXT,
  content TEXT,
  post_type TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  likes_count INTEGER,
  comments_count INTEGER,
  is_liked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as post_id,
    p.title,
    p.content,
    p.post_type,
    p.image_url,
    p.created_at,
    p.user_id,
    pr.display_name,
    pr.avatar_url,
    p.likes_count,
    p.comments_count,
    EXISTS(
      SELECT 1 FROM public.likes l 
      WHERE l.post_id = p.id AND l.user_id = user_id_param
    ) as is_liked
  FROM public.posts p
  JOIN public.profiles pr ON p.user_id = pr.user_id
  WHERE p.visibility = 'public'
    OR p.user_id = user_id_param
    OR (
      p.visibility = 'community' 
      AND p.community_id IN (
        SELECT community_id 
        FROM public.community_memberships 
        WHERE user_id = user_id_param
      )
    )
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update trending topics
CREATE OR REPLACE FUNCTION update_trending_topics()
RETURNS void AS $$
BEGIN
  -- Update trending topics based on recent hashtag usage
  INSERT INTO public.trending_topics (topic, mention_count, trend_score)
  SELECT 
    h.name,
    COUNT(ph.id)::INTEGER,
    COUNT(ph.id)::REAL * (1.0 / EXTRACT(EPOCH FROM (now() - MIN(p.created_at))::INTERVAL) * 86400)
  FROM public.hashtags h
  JOIN public.post_hashtags ph ON h.id = ph.hashtag_id
  JOIN public.posts p ON ph.post_id = p.id
  WHERE p.created_at > now() - interval '24 hours'
  GROUP BY h.id, h.name
  HAVING COUNT(ph.id) > 1
  ON CONFLICT (topic) DO UPDATE SET
    mention_count = EXCLUDED.mention_count,
    trend_score = EXCLUDED.trend_score,
    last_mentioned = now();
  
  -- Clean up old trending topics
  DELETE FROM public.trending_topics 
  WHERE last_mentioned < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create materialized view for popular content
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_posts AS
SELECT 
  p.id,
  p.title,
  p.content,
  p.created_at,
  p.likes_count,
  p.comments_count,
  p.shares_count,
  (p.likes_count * 1.0 + p.comments_count * 2.0 + p.shares_count * 3.0) / 
  EXTRACT(EPOCH FROM (now() - p.created_at))::REAL * 3600 as popularity_score
FROM public.posts p
WHERE p.visibility = 'public'
  AND p.created_at > now() - interval '30 days'
ORDER BY popularity_score DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_popular_posts_score ON popular_posts(popularity_score DESC);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW popular_posts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
