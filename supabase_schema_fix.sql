-- 1. Rebuild public.profiles as a VIEW with better fallbacks
DROP VIEW IF EXISTS public.profiles CASCADE;

CREATE VIEW public.profiles AS
SELECT
  id,
  email,
  raw_user_meta_data->>'avatar_url' AS avatar_url,
  COALESCE(
    raw_user_meta_data->>'display_name',
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'username',
    SPLIT_PART(email, '@', 1)
  ) AS display_name,
  COALESCE(
    raw_user_meta_data->>'username',
    SPLIT_PART(email, '@', 1)
  ) AS username
FROM auth.users;

-- 2. Ensure community_posts is correct
CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  caption text,
  image_url text,
  image_path text,
  created_at timestamptz DEFAULT now()
);

-- 3. Ensure policies allow SELECT / INSERT / DELETE
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Public read posts" ON community_posts;
DROP POLICY IF EXISTS "Users can create posts" ON community_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON community_posts;

-- Select posts
CREATE POLICY "Public read posts"
ON community_posts
FOR SELECT
TO authenticated
USING (true);

-- Insert posts
CREATE POLICY "Users can create posts"
ON community_posts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Delete own posts
CREATE POLICY "Users can delete own posts"
ON community_posts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
