
-- Create communities table with enhanced features
CREATE TABLE public.communities_enhanced (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  is_private BOOLEAN DEFAULT false,
  member_count INTEGER DEFAULT 0,
  welcome_message TEXT,
  rules TEXT,
  slow_mode_seconds INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community channels table
CREATE TABLE public.community_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities_enhanced(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'text', -- 'text', 'voice', 'announcement'
  position INTEGER DEFAULT 0,
  is_private BOOLEAN DEFAULT false,
  slowmode_seconds INTEGER DEFAULT 0,
  topic TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(community_id, name)
);

-- Create community roles table
CREATE TABLE public.community_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities_enhanced(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#99AAB5',
  position INTEGER DEFAULT 0,
  permissions JSONB DEFAULT '{}',
  mentionable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(community_id, name)
);

-- Create community members table with roles
CREATE TABLE public.community_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities_enhanced(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  nickname TEXT,
  roles UUID[] DEFAULT '{}',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  muted_until TIMESTAMP WITH TIME ZONE,
  banned BOOLEAN DEFAULT false,
  UNIQUE(community_id, user_id)
);

-- Enhanced messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.community_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'file', 'poll', 'system'
  reply_to UUID REFERENCES public.messages(id),
  thread_root UUID REFERENCES public.messages(id),
  attachments JSONB DEFAULT '[]',
  embeds JSONB DEFAULT '[]',
  reactions JSONB DEFAULT '{}',
  mentions UUID[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- For DMs, channel_id will be null and we'll use dm_conversation_id
  dm_conversation_id UUID
);

-- Direct message conversations
CREATE TABLE public.dm_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participants UUID[] NOT NULL,
  is_group BOOLEAN DEFAULT false,
  name TEXT, -- For group DMs
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Message read receipts
CREATE TABLE public.message_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Typing indicators
CREATE TABLE public.typing_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.community_channels(id) ON DELETE CASCADE,
  dm_conversation_id UUID REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id),
  UNIQUE(dm_conversation_id, user_id)
);

-- Pinned messages
CREATE TABLE public.pinned_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.community_channels(id) ON DELETE CASCADE,
  dm_conversation_id UUID REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL,
  pinned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id)
);

-- User bookmarks
CREATE TABLE public.user_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  bookmarked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id)
);

-- User blocks
CREATE TABLE public.user_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Moderation logs
CREATE TABLE public.moderation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities_enhanced(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL,
  target_user_id UUID,
  action TEXT NOT NULL, -- 'mute', 'ban', 'kick', 'delete_message', etc.
  reason TEXT,
  duration INTEGER, -- in seconds, for temporary actions
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Custom emojis per community
CREATE TABLE public.custom_emojis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities_enhanced(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(community_id, name)
);

-- Voice chat sessions
CREATE TABLE public.voice_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.community_channels(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL, -- Jitsi room ID
  participants UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  started_by UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.communities_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_emojis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Communities
CREATE POLICY "Communities are viewable by everyone" ON public.communities_enhanced FOR SELECT USING (true);
CREATE POLICY "Users can create communities" ON public.communities_enhanced FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Community creators can update" ON public.communities_enhanced FOR UPDATE USING (auth.uid() = created_by);

-- Community channels
CREATE POLICY "Channels viewable by community members" ON public.community_channels FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_id = community_channels.community_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY "Community admins can manage channels" ON public.community_channels FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.community_members cm
    JOIN public.community_roles cr ON cr.id = ANY(cm.roles)
    WHERE cm.community_id = community_channels.community_id 
    AND cm.user_id = auth.uid()
    AND (cr.permissions->>'manage_channels')::boolean = true
  )
);

-- Community members
CREATE POLICY "Members viewable by community members" ON public.community_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_members 
    WHERE community_id = community_members.community_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY "Users can join communities" ON public.community_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messages
CREATE POLICY "Messages viewable by channel members" ON public.messages FOR SELECT
USING (
  CASE 
    WHEN channel_id IS NOT NULL THEN
      EXISTS (
        SELECT 1 FROM public.community_channels cc
        JOIN public.community_members cm ON cm.community_id = cc.community_id
        WHERE cc.id = messages.channel_id AND cm.user_id = auth.uid()
      )
    WHEN dm_conversation_id IS NOT NULL THEN
      EXISTS (
        SELECT 1 FROM public.dm_conversations dc
        WHERE dc.id = messages.dm_conversation_id AND auth.uid() = ANY(dc.participants)
      )
    ELSE false
  END
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can edit their messages" ON public.messages FOR UPDATE USING (auth.uid() = user_id);

-- DM Conversations
CREATE POLICY "Users can view their DM conversations" ON public.dm_conversations FOR SELECT
USING (auth.uid() = ANY(participants));
CREATE POLICY "Users can create DM conversations" ON public.dm_conversations FOR INSERT
WITH CHECK (auth.uid() = ANY(participants));

-- User bookmarks
CREATE POLICY "Users can manage their bookmarks" ON public.user_bookmarks FOR ALL USING (auth.uid() = user_id);

-- User blocks
CREATE POLICY "Users can manage their blocks" ON public.user_blocks FOR ALL USING (auth.uid() = blocker_id);

-- Create indexes for performance
CREATE INDEX idx_community_channels_community_id ON public.community_channels(community_id);
CREATE INDEX idx_community_members_community_id ON public.community_members(community_id);
CREATE INDEX idx_community_members_user_id ON public.community_members(user_id);
CREATE INDEX idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX idx_messages_dm_conversation_id ON public.messages(dm_conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_dm_conversations_participants ON public.dm_conversations USING GIN(participants);
CREATE INDEX idx_typing_indicators_channel_id ON public.typing_indicators(channel_id);
CREATE INDEX idx_typing_indicators_dm_conversation_id ON public.typing_indicators(dm_conversation_id);

-- Create default roles for communities
CREATE OR REPLACE FUNCTION create_default_community_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- Create admin role
  INSERT INTO public.community_roles (community_id, name, color, position, permissions)
  Values (NEW.id, 'Admin', '#ff4444', 100, '{"manage_channels": true, "manage_roles": true, "manage_members": true, "delete_messages": true}');
  
  -- Create moderator role  
  INSERT INTO public.community_roles (community_id, name, color, position, permissions)
  Values (NEW.id, 'Moderator', '#5865f2', 50, '{"delete_messages": true, "manage_members": true}');
  
  -- Create member role
  INSERT INTO public.community_roles (community_id, name, color, position, permissions)
  Values (NEW.id, 'Member', '#99aab5', 10, '{"send_messages": true, "read_messages": true}');
  
  -- Create general channel
  INSERT INTO public.community_channels (community_id, name, description, created_by, position)
  VALUES (NEW.id, 'general', 'General discussion', NEW.created_by, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_default_community_roles_trigger
  AFTER INSERT ON public.communities_enhanced
  FOR EACH ROW EXECUTE FUNCTION create_default_community_roles();

-- Function to clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM public.typing_indicators 
  WHERE started_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;
