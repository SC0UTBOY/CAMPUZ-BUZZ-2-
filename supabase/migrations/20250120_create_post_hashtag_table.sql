-- Create post_hashtag table for storing hashtags separately
-- This allows for better querying and avoids duplicates per post

CREATE TABLE IF NOT EXISTS public.post_hashtag (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL,
  hashtag text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT post_hashtag_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
  CONSTRAINT post_hashtag_unique UNIQUE (post_id, hashtag)
);

-- Create index for faster hashtag lookups
CREATE INDEX IF NOT EXISTS idx_post_hashtag_hashtag ON public.post_hashtag(hashtag);
CREATE INDEX IF NOT EXISTS idx_post_hashtag_post_id ON public.post_hashtag(post_id);

-- Enable RLS
ALTER TABLE public.post_hashtag ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view hashtags" ON public.post_hashtag
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert hashtags" ON public.post_hashtag
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own post hashtags" ON public.post_hashtag
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_hashtag.post_id
      AND posts.user_id = auth.uid()
    )
  );

