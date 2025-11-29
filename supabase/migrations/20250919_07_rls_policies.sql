-- Row Level Security Policies Migration (Part 7)

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Posts Policies
DROP POLICY IF EXISTS "Anyone can view public posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

CREATE POLICY "Anyone can view public posts" ON public.posts
  FOR SELECT USING (
    visibility = 'public' OR 
    auth.uid() = user_id OR
    (visibility = 'community' AND community_id IN (
      SELECT community_id FROM public.community_members 
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create their own posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- Comments Policies
DROP POLICY IF EXISTS "Anyone can view comments on visible posts" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

CREATE POLICY "Anyone can view comments on visible posts" ON public.comments
  FOR SELECT USING (
    post_id IN (
      SELECT id FROM public.posts 
      WHERE visibility = 'public' OR 
            auth.uid() = user_id OR
            (visibility = 'community' AND community_id IN (
              SELECT community_id FROM public.community_members 
              WHERE user_id = auth.uid()
            ))
    )
  );

CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    post_id IN (
      SELECT id FROM public.posts 
      WHERE visibility = 'public' OR 
            auth.uid() = posts.user_id OR
            (visibility = 'community' AND community_id IN (
              SELECT community_id FROM public.community_memberships 
              WHERE user_id = auth.uid()
            ))
    )
  );

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Likes Policies
DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.likes;

CREATE POLICY "Anyone can view likes" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON public.likes
  FOR ALL USING (auth.uid() = user_id);

-- Communities Enhanced Policies
DROP POLICY IF EXISTS "Anyone can view public communities" ON public.communities_enhanced;
DROP POLICY IF EXISTS "Users can create communities" ON public.communities_enhanced;
DROP POLICY IF EXISTS "Community creators can update their communities" ON public.communities_enhanced;

CREATE POLICY "Anyone can view public communities" ON public.communities_enhanced
  FOR SELECT USING (
    NOT is_private OR 
    auth.uid() = created_by OR
    id IN (
      SELECT community_id FROM public.community_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create communities" ON public.communities_enhanced
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Community creators can update their communities" ON public.communities_enhanced
  FOR UPDATE USING (auth.uid() = created_by);

-- Community Members Policies (renamed from community_memberships)
DROP POLICY IF EXISTS "Users can view community members" ON public.community_members;
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON public.community_members;

CREATE POLICY "Users can view community members" ON public.community_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    community_id IN (
      SELECT community_id FROM public.community_members cm
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join communities" ON public.community_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities" ON public.community_members
  FOR DELETE USING (auth.uid() = user_id);

-- Study Groups Policies
DROP POLICY IF EXISTS "Anyone can view public study groups" ON public.study_groups;
DROP POLICY IF EXISTS "Users can create study groups" ON public.study_groups;
DROP POLICY IF EXISTS "Study group creators can update their groups" ON public.study_groups;

CREATE POLICY "Anyone can view public study groups" ON public.study_groups
  FOR SELECT USING (
    NOT is_private OR 
    auth.uid() = created_by OR
    id IN (
      SELECT study_group_id FROM public.study_group_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create study groups" ON public.study_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Study group creators can update their groups" ON public.study_groups
  FOR UPDATE USING (auth.uid() = created_by);

-- Study Group Members Policies
DROP POLICY IF EXISTS "Users can view study group members" ON public.study_group_members;
DROP POLICY IF EXISTS "Users can join study groups" ON public.study_group_members;
DROP POLICY IF EXISTS "Users can leave study groups" ON public.study_group_members;

CREATE POLICY "Users can view study group members" ON public.study_group_members
  FOR SELECT USING (
    study_group_id IN (
      SELECT id FROM public.study_groups 
      WHERE NOT is_private OR 
            auth.uid() = created_by OR
            id IN (
              SELECT study_group_id FROM public.study_group_members sgm
              WHERE sgm.user_id = auth.uid()
            )
    )
  );

CREATE POLICY "Users can join study groups" ON public.study_group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave study groups" ON public.study_group_members
  FOR DELETE USING (auth.uid() = user_id);

-- Events Policies
DROP POLICY IF EXISTS "Anyone can view public events" ON public.events;
DROP POLICY IF EXISTS "Users can create events" ON public.events;
DROP POLICY IF EXISTS "Event creators can update their events" ON public.events;

CREATE POLICY "Anyone can view public events" ON public.events
  FOR SELECT USING (
    is_public OR 
    auth.uid() = created_by OR
    (community_id IS NOT NULL AND community_id IN (
      SELECT community_id FROM public.community_memberships 
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Event creators can update their events" ON public.events
  FOR UPDATE USING (auth.uid() = created_by);

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Chat Rooms Policies
DROP POLICY IF EXISTS "Users can view accessible chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;

CREATE POLICY "Users can view accessible chat rooms" ON public.chat_rooms
  FOR SELECT USING (
    NOT is_private OR 
    auth.uid() = created_by OR
    id IN (
      SELECT room_id FROM public.chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chat rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Chat Messages Policies
DROP POLICY IF EXISTS "Users can view messages in accessible rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages;

CREATE POLICY "Users can view messages in accessible rooms" ON public.chat_messages
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM public.chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    room_id IN (
      SELECT room_id FROM public.chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON public.chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

-- Security and Privacy Policies
DROP POLICY IF EXISTS "Users can view their own security settings" ON public.user_security_settings;
DROP POLICY IF EXISTS "Users can update their own security settings" ON public.user_security_settings;

CREATE POLICY "Users can view their own security settings" ON public.user_security_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own security settings" ON public.user_security_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own security settings" ON public.user_security_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Blocks Policies
DROP POLICY IF EXISTS "Users can view their own blocks" ON public.user_blocks;
DROP POLICY IF EXISTS "Users can manage their own blocks" ON public.user_blocks;

CREATE POLICY "Users can view their own blocks" ON public.user_blocks
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can manage their own blocks" ON public.user_blocks
  FOR ALL USING (auth.uid() = blocker_id);

-- Analytics Policies (restricted access)
DROP POLICY IF EXISTS "Only authenticated users can view analytics" ON public.analytics_events;
CREATE POLICY "Only authenticated users can view analytics" ON public.analytics_events
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view their own analytics" ON public.user_analytics;
CREATE POLICY "Users can view their own analytics" ON public.user_analytics
  FOR SELECT USING (auth.uid() = user_id);

-- Push Notification Tokens Policies
DROP POLICY IF EXISTS "Users can manage their own tokens" ON public.push_notification_tokens;
CREATE POLICY "Users can manage their own tokens" ON public.push_notification_tokens
  FOR ALL USING (auth.uid() = user_id);
