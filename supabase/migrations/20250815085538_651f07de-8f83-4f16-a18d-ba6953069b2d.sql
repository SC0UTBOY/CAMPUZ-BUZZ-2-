
-- Create tables for real-time chat system
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  reply_to UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]',
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.typing_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_rooms
CREATE POLICY "Users can view rooms they participate in" ON public.chat_rooms
  FOR SELECT USING (
    NOT is_private OR 
    id IN (SELECT room_id FROM public.chat_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creators can update their rooms" ON public.chat_rooms
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for chat_participants
CREATE POLICY "Users can view participants of rooms they're in" ON public.chat_participants
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM public.chat_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can join rooms" ON public.chat_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" ON public.chat_participants
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages from rooms they participate in" ON public.chat_messages
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM public.chat_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can send messages to rooms they participate in" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    room_id IN (SELECT room_id FROM public.chat_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can edit their own messages" ON public.chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON public.chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for typing_status
CREATE POLICY "Users can manage their own typing status" ON public.typing_status
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view typing status in rooms they participate in" ON public.typing_status
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM public.chat_participants WHERE user_id = auth.uid())
  );

-- Enable realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;

-- Set replica identity for real-time updates
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.typing_status REPLICA IDENTITY FULL;
ALTER TABLE public.chat_participants REPLICA IDENTITY FULL;

-- Create indexes for better performance
CREATE INDEX idx_chat_messages_room_created ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX idx_chat_participants_user ON public.chat_participants(user_id);
CREATE INDEX idx_typing_status_room ON public.typing_status(room_id);

-- Create a function to clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM public.typing_status 
  WHERE started_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;
