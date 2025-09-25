-- Fix the relationship between chat_participants and profiles
-- The issue is that profiles table uses 'user_id' but chat_participants references 'id' from auth.users

-- First, check if the profiles table has the correct structure
-- If profiles.user_id exists, we need to update the foreign key relationship

-- Add foreign key constraint from chat_participants to profiles
-- This assumes profiles table has user_id column that references auth.users(id)

-- Drop existing constraint if it exists (this might fail if it doesn't exist, which is fine)
ALTER TABLE public.chat_participants 
DROP CONSTRAINT IF EXISTS chat_participants_profiles_fkey;

-- Add the correct foreign key relationship
-- This links chat_participants.user_id to profiles.user_id
ALTER TABLE public.chat_participants 
ADD CONSTRAINT chat_participants_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Create an index for better performance on profile lookups
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_profile 
ON public.chat_participants(user_id);

-- Also ensure profiles table has proper indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON public.profiles(user_id);

-- Update RLS policies to ensure proper access
-- Allow users to see participant profiles in rooms they're part of
CREATE OR REPLACE POLICY "Users can view participant profiles in their rooms" 
ON public.profiles
FOR SELECT 
USING (
  user_id IN (
    SELECT DISTINCT cp.user_id 
    FROM public.chat_participants cp
    WHERE cp.room_id IN (
      SELECT room_id 
      FROM public.chat_participants 
      WHERE user_id = auth.uid()
    )
  )
);
