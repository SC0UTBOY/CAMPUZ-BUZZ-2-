-- Schema Migration: Align with target schema while preserving data
-- Based on the schema diagram, we need to:
-- 1. Add missing tables: likes, server_members, channels, servers
-- 2. Rename community tables to servers
-- 3. Update foreign key relationships
-- 4. Add missing columns

-- First, create the likes table (appears to be missing)
CREATE TABLE IF NOT EXISTS public.likes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    post_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, post_id)
);

-- Create servers table (renaming communities)
CREATE TABLE IF NOT EXISTS public.servers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    owner_id uuid NOT NULL,
    invite_code text,
    is_public boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create server_members table (renaming community_members)
CREATE TABLE IF NOT EXISTS public.server_members (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    server_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'member',
    joined_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(server_id, user_id)
);

-- Create channels table (renaming community_channels)
CREATE TABLE IF NOT EXISTS public.channels (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    server_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    type text NOT NULL DEFAULT 'text',
    position integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Update posts table to include image_url if missing
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS image_url text;

-- Update profiles table to match schema
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS avatar text;

-- Add proper foreign key constraints
ALTER TABLE public.likes 
ADD CONSTRAINT fk_likes_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_likes_post_id FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.server_members
ADD CONSTRAINT fk_server_members_server_id FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_server_members_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.channels
ADD CONSTRAINT fk_channels_server_id FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE CASCADE;

ALTER TABLE public.messages
ADD CONSTRAINT fk_messages_channel_id FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_messages_author_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for likes
CREATE POLICY "Users can like posts" ON public.likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" ON public.likes
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Likes are viewable by everyone" ON public.likes
    FOR SELECT USING (true);

-- Create RLS policies for servers
CREATE POLICY "Public servers are viewable by everyone" ON public.servers
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create servers" ON public.servers
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Server owners can update their servers" ON public.servers
    FOR UPDATE USING (auth.uid() = owner_id);

-- Create RLS policies for server_members
CREATE POLICY "Server members can view member list" ON public.server_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.server_members sm2 
            WHERE sm2.server_id = server_members.server_id 
            AND sm2.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join servers" ON public.server_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave servers" ON public.server_members
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for channels
CREATE POLICY "Channel access for server members" ON public.channels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.server_members sm
            WHERE sm.server_id = channels.server_id 
            AND sm.user_id = auth.uid()
        )
    );

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_servers_updated_at
    BEFORE UPDATE ON public.servers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_channels_updated_at
    BEFORE UPDATE ON public.channels
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();