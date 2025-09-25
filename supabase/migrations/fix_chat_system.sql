-- Fix Chat System - Create Missing Tables and Components
-- Run this in Supabase SQL Editor

-- 1. Create chat_rooms table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create chat_participants table
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- 3. Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reply_to UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_room_id ON public.chat_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON public.chat_rooms(created_by);

-- 5. Enable RLS (Row Level Security)
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view rooms they participate in" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can update their own rooms" ON public.chat_rooms;

DROP POLICY IF EXISTS "Users can view their participations" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can join rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can update their participation" ON public.chat_participants;

DROP POLICY IF EXISTS "Users can view messages in rooms they participate in" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to rooms they participate in" ON public.chat_messages;

-- 7. Create RLS policies for chat_rooms
CREATE POLICY "Users can view rooms they participate in" ON public.chat_rooms
  FOR SELECT USING (
    id IN (
      SELECT room_id FROM public.chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own rooms" ON public.chat_rooms
  FOR UPDATE USING (auth.uid() = created_by);

-- 8. Create RLS policies for chat_participants
CREATE POLICY "Users can view their participations" ON public.chat_participants
  FOR SELECT USING (
    user_id = auth.uid() OR 
    room_id IN (
      SELECT room_id FROM public.chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join rooms" ON public.chat_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participation" ON public.chat_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- 9. Create RLS policies for chat_messages
CREATE POLICY "Users can view messages in rooms they participate in" ON public.chat_messages
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM public.chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to rooms they participate in" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    room_id IN (
      SELECT room_id FROM public.chat_participants 
      WHERE user_id = auth.uid()
    )
  );

-- 10. Create function to update room's updated_at when message is sent
CREATE OR REPLACE FUNCTION update_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_rooms 
  SET updated_at = NOW() 
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger for updating room timestamp
DROP TRIGGER IF EXISTS trigger_update_room_timestamp ON public.chat_messages;
CREATE TRIGGER trigger_update_room_timestamp
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_room_timestamp();

-- 12. Enable realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- 13. Create some sample data for testing
DO $$
DECLARE
  sample_room_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user ID (if authenticated)
  SELECT auth.uid() INTO current_user_id;
  
  -- Only create sample data if user is authenticated
  IF current_user_id IS NOT NULL THEN
    -- Create a general chat room
    INSERT INTO public.chat_rooms (id, name, description, created_by)
    VALUES (gen_random_uuid(), 'General Chat', 'Welcome to CampuzBuzz! Introduce yourself here.', current_user_id)
    RETURNING id INTO sample_room_id;
    
    -- Add current user as participant
    INSERT INTO public.chat_participants (room_id, user_id)
    VALUES (sample_room_id, current_user_id)
    ON CONFLICT (room_id, user_id) DO NOTHING;
    
    -- Add a welcome message
    INSERT INTO public.chat_messages (room_id, user_id, content)
    VALUES (sample_room_id, current_user_id, 'Welcome to CampuzBuzz chat! 🎉');
  END IF;
END $$;

-- 14. Verify tables were created
SELECT 
  'Chat tables created successfully! 💬' as status,
  (SELECT COUNT(*) FROM public.chat_rooms) as rooms_count,
  (SELECT COUNT(*) FROM public.chat_participants) as participants_count,
  (SELECT COUNT(*) FROM public.chat_messages) as messages_count;
