
-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', true),
  ('posts', 'posts', true),
  ('attachments', 'attachments', true),
  ('communities', 'communities', true);

-- Create storage policies for public access
CREATE POLICY "Avatar uploads are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Post uploads are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'posts');

CREATE POLICY "Attachment uploads are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'attachments');

CREATE POLICY "Community uploads are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'communities');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload posts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload community files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'communities' AND auth.role() = 'authenticated');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own uploads" ON storage.objects
  FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Create study_groups table
CREATE TABLE public.study_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  max_members INTEGER DEFAULT 10,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tags TEXT[] DEFAULT '{}',
  location TEXT,
  meeting_schedule JSONB
);

-- Create study_group_members table
CREATE TABLE public.study_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  study_group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(study_group_id, user_id)
);

-- Create study_sessions table
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  study_group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  is_virtual BOOLEAN DEFAULT false,
  meeting_link TEXT,
  max_participants INTEGER,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on study groups tables
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- Study groups policies
CREATE POLICY "Public study groups are viewable by everyone" 
  ON public.study_groups FOR SELECT 
  USING (NOT is_private OR EXISTS (
    SELECT 1 FROM public.study_group_members 
    WHERE study_group_id = study_groups.id AND user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create study groups" 
  ON public.study_groups FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Study group creators can update their groups" 
  ON public.study_groups FOR UPDATE 
  USING (auth.uid() = created_by);

-- Study group members policies
CREATE POLICY "Study group members are viewable by group members" 
  ON public.study_group_members FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.study_group_members sgm 
    WHERE sgm.study_group_id = study_group_members.study_group_id 
    AND sgm.user_id = auth.uid()
  ));

CREATE POLICY "Users can join public study groups" 
  ON public.study_group_members FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave study groups" 
  ON public.study_group_members FOR DELETE 
  USING (auth.uid() = user_id);

-- Study sessions policies
CREATE POLICY "Study sessions are viewable by group members" 
  ON public.study_sessions FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.study_group_members 
    WHERE study_group_id = study_sessions.study_group_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Group members can create study sessions" 
  ON public.study_sessions FOR INSERT 
  WITH CHECK (auth.uid() = created_by AND EXISTS (
    SELECT 1 FROM public.study_group_members 
    WHERE study_group_id = study_sessions.study_group_id 
    AND user_id = auth.uid()
  ));

-- Add triggers for updated_at
CREATE TRIGGER update_study_groups_updated_at
  BEFORE UPDATE ON public.study_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-join creator to study group
CREATE OR REPLACE FUNCTION public.auto_join_study_group_creator()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.study_group_members (study_group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-join creator
CREATE TRIGGER auto_join_study_group_creator_trigger
  AFTER INSERT ON public.study_groups
  FOR EACH ROW EXECUTE FUNCTION public.auto_join_study_group_creator();

-- Update messages table to support file attachments (if not already present)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sessions;
