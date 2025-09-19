-- Ensure likes table exists with proper structure

-- Create likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  -- Add foreign key to posts table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'likes_post_id_fkey'
  ) THEN
    ALTER TABLE public.likes 
    ADD CONSTRAINT likes_post_id_fkey 
    FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key to users table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'likes_user_id_fkey'
  ) THEN
    ALTER TABLE public.likes 
    ADD CONSTRAINT likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'likes_post_user_unique'
  ) THEN
    ALTER TABLE public.likes 
    ADD CONSTRAINT likes_post_user_unique 
    UNIQUE (post_id, user_id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view all likes" ON public.likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.likes;

-- Create RLS policies
CREATE POLICY "Users can view all likes" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON public.likes
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_user ON public.likes(post_id, user_id);

-- Ensure posts table has likes_count column
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Update existing posts to have correct like counts
UPDATE public.posts 
SET likes_count = (
  SELECT COUNT(*) 
  FROM public.likes 
  WHERE likes.post_id = posts.id
);

-- Create function to update like counts
CREATE OR REPLACE FUNCTION update_post_like_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.posts 
  SET likes_count = (
    SELECT COUNT(*) 
    FROM public.likes 
    WHERE likes.post_id = update_post_like_count.post_id
  )
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_update_post_like_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_post_like_count(NEW.post_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_post_like_count(OLD.post_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS likes_count_trigger ON public.likes;

-- Create the trigger
CREATE TRIGGER likes_count_trigger
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_post_like_count();
