-- Fix the relationship between comments and profiles tables

-- 1. Ensure the comments table has proper foreign key to profiles
-- First check if the foreign key exists, if not create it
DO $$
BEGIN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'comments_user_id_profiles_fkey'
    ) THEN
        ALTER TABLE public.comments 
        ADD CONSTRAINT comments_user_id_profiles_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Ensure profiles table has proper structure
-- Make sure profiles.user_id exists and references auth.users(id)
DO $$
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- 4. Ensure RLS policies allow proper access
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all comments" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can manage their own comments" ON public.comments;

-- Create new RLS policies
CREATE POLICY "Users can view all comments" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Ensure profiles are accessible for comments
DROP POLICY IF EXISTS "Users can view profiles for comments" ON public.profiles;

CREATE POLICY "Users can view profiles for comments" ON public.profiles
  FOR SELECT USING (true);

-- 6. Update any existing comments to ensure they have valid user_ids
-- This will help if there are orphaned records
UPDATE public.comments 
SET user_id = (
  SELECT id FROM auth.users 
  WHERE auth.users.id = comments.user_id 
  LIMIT 1
)
WHERE user_id IS NOT NULL;
