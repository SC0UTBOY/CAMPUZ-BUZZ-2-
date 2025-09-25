-- Functions and Triggers Migration (Part 8)

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to handle profile creation on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create security settings
  INSERT INTO public.user_security_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to update post counts
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update likes count
    IF NEW.post_id IS NOT NULL THEN
      UPDATE public.posts 
      SET likes_count = likes_count + 1
      WHERE id = NEW.post_id;
    END IF;
    
    -- Update comments count
    IF NEW.comment_id IS NOT NULL THEN
      UPDATE public.comments 
      SET likes_count = likes_count + 1
      WHERE id = NEW.comment_id;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update likes count
    IF OLD.post_id IS NOT NULL THEN
      UPDATE public.posts 
      SET likes_count = GREATEST(likes_count - 1, 0)
      WHERE id = OLD.post_id;
    END IF;
    
    -- Update comments count
    IF OLD.comment_id IS NOT NULL THEN
      UPDATE public.comments 
      SET likes_count = GREATEST(likes_count - 1, 0)
      WHERE id = OLD.comment_id;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to update comment counts on posts
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to update community member counts
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities_enhanced 
    SET member_count = member_count + 1
    WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities_enhanced 
    SET member_count = GREATEST(member_count - 1, 0)
    WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to update event attendee counts
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'going' THEN
    UPDATE public.events 
    SET attendee_count = attendee_count + 1
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'going' THEN
    UPDATE public.events 
    SET attendee_count = GREATEST(attendee_count - 1, 0)
    WHERE id = OLD.event_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'going' AND NEW.status != 'going' THEN
      UPDATE public.events 
      SET attendee_count = GREATEST(attendee_count - 1, 0)
      WHERE id = NEW.event_id;
    ELSIF OLD.status != 'going' AND NEW.status = 'going' THEN
      UPDATE public.events 
      SET attendee_count = attendee_count + 1
      WHERE id = NEW.event_id;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to handle hashtag creation and updates
CREATE OR REPLACE FUNCTION handle_hashtags()
RETURNS TRIGGER AS $$
DECLARE
  hashtag_name TEXT;
  hashtag_record RECORD;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Process hashtags from the post
    IF NEW.hashtags IS NOT NULL THEN
      FOREACH hashtag_name IN ARRAY NEW.hashtags
      LOOP
        -- Insert or update hashtag
        INSERT INTO public.hashtags (name, usage_count)
        VALUES (hashtag_name, 1)
        ON CONFLICT (name) 
        DO UPDATE SET usage_count = hashtags.usage_count + 1;
        
        -- Get hashtag ID and create relationship
        SELECT id INTO hashtag_record FROM public.hashtags WHERE name = hashtag_name;
        
        INSERT INTO public.post_hashtags (post_id, hashtag_id)
        VALUES (NEW.id, hashtag_record.id)
        ON CONFLICT (post_id, hashtag_id) DO NOTHING;
      END LOOP;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrease hashtag usage count
    IF OLD.hashtags IS NOT NULL THEN
      FOREACH hashtag_name IN ARRAY OLD.hashtags
      LOOP
        UPDATE public.hashtags 
        SET usage_count = GREATEST(usage_count - 1, 0)
        WHERE name = hashtag_name;
        
        -- Remove relationship
        DELETE FROM public.post_hashtags 
        WHERE post_id = OLD.id 
        AND hashtag_id = (SELECT id FROM public.hashtags WHERE name = hashtag_name);
      END LOOP;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to handle post mentions
CREATE OR REPLACE FUNCTION handle_post_mentions()
RETURNS TRIGGER AS $$
DECLARE
  mention_user_id UUID;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Clear existing mentions for updates
    IF TG_OP = 'UPDATE' THEN
      DELETE FROM public.post_mentions WHERE post_id = NEW.id;
    END IF;
    
    -- Process mentions from the post
    IF NEW.mentions IS NOT NULL THEN
      FOREACH mention_user_id IN ARRAY NEW.mentions::UUID[]
      LOOP
        INSERT INTO public.post_mentions (post_id, mentioned_user_id)
        VALUES (NEW.id, mention_user_id)
        ON CONFLICT (post_id, mentioned_user_id) DO NOTHING;
        
        -- Create notification for mentioned user
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
          mention_user_id,
          'mention',
          'You were mentioned in a post',
          'Someone mentioned you in their post',
          jsonb_build_object('post_id', NEW.id, 'user_id', NEW.user_id)
        );
      END LOOP;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove mentions
    DELETE FROM public.post_mentions WHERE post_id = OLD.id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to clean up expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
  -- Clean up expired KV store entries
  DELETE FROM public.kv_store_2a876eaa 
  WHERE expires_at IS NOT NULL AND expires_at < now();
  
  -- Clean up old typing indicators (older than 10 seconds)
  DELETE FROM public.typing_indicators 
  WHERE started_at < now() - interval '10 seconds';
  
  -- Clean up old rate limit entries (older than 1 hour)
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - interval '1 hour' AND blocked_until < now();
  
  -- Clean up old analytics events (older than 90 days)
  DELETE FROM public.analytics_events 
  WHERE created_at < now() - interval '90 days';
  
  -- Clean up old user analytics (older than 90 days)
  DELETE FROM public.user_analytics 
  WHERE created_at < now() - interval '90 days';
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at 
  BEFORE UPDATE ON public.posts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at 
  BEFORE UPDATE ON public.comments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communities_enhanced_updated_at 
  BEFORE UPDATE ON public.communities_enhanced 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_groups_updated_at 
  BEFORE UPDATE ON public.study_groups 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at 
  BEFORE UPDATE ON public.events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create triggers for count updates
CREATE TRIGGER update_post_like_counts
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

CREATE TRIGGER update_post_comment_counts
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

CREATE TRIGGER update_community_member_counts
  AFTER INSERT OR DELETE ON public.community_memberships
  FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

CREATE TRIGGER update_event_attendee_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION update_event_attendee_count();

-- Create triggers for hashtag and mention handling
CREATE TRIGGER handle_post_hashtags
  AFTER INSERT OR UPDATE OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION handle_hashtags();

CREATE TRIGGER handle_mentions
  AFTER INSERT OR UPDATE OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION handle_post_mentions();
