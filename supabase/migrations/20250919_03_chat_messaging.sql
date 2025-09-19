-- Chat and Messaging Migration (Part 3)

-- 1. Chat Rooms
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_private boolean DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_rooms_pkey PRIMARY KEY (id),
  CONSTRAINT chat_rooms_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Chat Participants
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid,
  user_id uuid,
  joined_at timestamp with time zone DEFAULT now(),
  last_read_at timestamp with time zone DEFAULT now(),
  role text DEFAULT 'member'::text CHECK (role IN ('admin', 'moderator', 'member')),
  CONSTRAINT chat_participants_pkey PRIMARY KEY (id),
  CONSTRAINT chat_participants_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  CONSTRAINT chat_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT chat_participants_unique UNIQUE (room_id, user_id)
);

-- 3. Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid,
  user_id uuid,
  content text NOT NULL,
  message_type text DEFAULT 'text'::text CHECK (message_type IN ('text', 'image', 'file', 'system')),
  reply_to uuid,
  attachments jsonb DEFAULT '[]',
  edited_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT chat_messages_reply_to_fkey FOREIGN KEY (reply_to) REFERENCES public.chat_messages(id) ON DELETE SET NULL
);

-- 4. Community Channels
CREATE TABLE IF NOT EXISTS public.community_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'text'::text,
  position integer DEFAULT 0,
  is_private boolean DEFAULT false,
  slowmode_seconds integer DEFAULT 0,
  topic text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT community_channels_pkey PRIMARY KEY (id),
  CONSTRAINT community_channels_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities_enhanced(id) ON DELETE CASCADE,
  CONSTRAINT community_channels_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 5. DM Conversations
CREATE TABLE IF NOT EXISTS public.dm_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  participants uuid[] NOT NULL,
  is_group boolean DEFAULT false,
  name text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dm_conversations_pkey PRIMARY KEY (id),
  CONSTRAINT dm_conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 6. Messages (unified for channels and DMs)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  channel_id uuid,
  user_id uuid NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text'::text,
  reply_to uuid,
  thread_root uuid,
  attachments jsonb DEFAULT '[]',
  embeds jsonb DEFAULT '[]',
  reactions jsonb DEFAULT '{}',
  mentions uuid[] DEFAULT '{}',
  is_pinned boolean DEFAULT false,
  is_edited boolean DEFAULT false,
  edited_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  dm_conversation_id uuid,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.community_channels(id) ON DELETE CASCADE,
  CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT messages_reply_to_fkey FOREIGN KEY (reply_to) REFERENCES public.messages(id) ON DELETE SET NULL,
  CONSTRAINT messages_thread_root_fkey FOREIGN KEY (thread_root) REFERENCES public.messages(id) ON DELETE SET NULL,
  CONSTRAINT messages_dm_conversation_id_fkey FOREIGN KEY (dm_conversation_id) REFERENCES public.dm_conversations(id) ON DELETE CASCADE
);

-- 7. Message Reads
CREATE TABLE IF NOT EXISTS public.message_reads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT message_reads_pkey PRIMARY KEY (id),
  CONSTRAINT message_reads_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE,
  CONSTRAINT message_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT message_reads_unique UNIQUE (message_id, user_id)
);

-- 8. Pinned Messages
CREATE TABLE IF NOT EXISTS public.pinned_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL UNIQUE,
  channel_id uuid,
  dm_conversation_id uuid,
  pinned_by uuid NOT NULL,
  pinned_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pinned_messages_pkey PRIMARY KEY (id),
  CONSTRAINT pinned_messages_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.community_channels(id) ON DELETE CASCADE,
  CONSTRAINT pinned_messages_dm_conversation_id_fkey FOREIGN KEY (dm_conversation_id) REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  CONSTRAINT pinned_messages_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE,
  CONSTRAINT pinned_messages_pinned_by_fkey FOREIGN KEY (pinned_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 9. Typing Indicators
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  channel_id uuid,
  dm_conversation_id uuid,
  user_id uuid NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT typing_indicators_pkey PRIMARY KEY (id),
  CONSTRAINT typing_indicators_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.community_channels(id) ON DELETE CASCADE,
  CONSTRAINT typing_indicators_dm_conversation_id_fkey FOREIGN KEY (dm_conversation_id) REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  CONSTRAINT typing_indicators_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 10. User Bookmarks
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message_id uuid NOT NULL,
  bookmarked_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_bookmarks_pkey PRIMARY KEY (id),
  CONSTRAINT user_bookmarks_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE,
  CONSTRAINT user_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_bookmarks_unique UNIQUE (user_id, message_id)
);

-- Enable Row Level Security
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_channels_community_id ON public.community_channels(community_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_dm_conversation_id ON public.messages(dm_conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON public.message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_channel_id ON public.typing_indicators(channel_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_dm_conversation_id ON public.typing_indicators(dm_conversation_id);
