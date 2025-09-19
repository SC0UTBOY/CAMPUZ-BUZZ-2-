
-- Create session participants table to track attendance
CREATE TABLE public.session_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.study_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'missed', 'cancelled')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create study materials table
CREATE TABLE public.study_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  study_group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create study group analytics table
CREATE TABLE public.study_group_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  study_group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value JSONB NOT NULL DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies for session participants
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view session participants" 
  ON public.session_participants 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.study_sessions ss
      JOIN public.study_group_members sgm ON sgm.study_group_id = ss.study_group_id
      WHERE ss.id = session_participants.session_id 
      AND sgm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join sessions" 
  ON public.session_participants 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.study_sessions ss
      JOIN public.study_group_members sgm ON sgm.study_group_id = ss.study_group_id
      WHERE ss.id = session_participants.session_id 
      AND sgm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their session participation" 
  ON public.session_participants 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add RLS policies for study materials
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view study materials" 
  ON public.study_materials 
  FOR SELECT 
  USING (
    is_public = true OR
    EXISTS (
      SELECT 1 FROM public.study_group_members sgm
      WHERE sgm.study_group_id = study_materials.study_group_id 
      AND sgm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can upload study materials" 
  ON public.study_materials 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.study_group_members sgm
      WHERE sgm.study_group_id = study_materials.study_group_id 
      AND sgm.user_id = auth.uid()
    )
  );

CREATE POLICY "Material uploaders can update their materials" 
  ON public.study_materials 
  FOR UPDATE 
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Material uploaders can delete their materials" 
  ON public.study_materials 
  FOR DELETE 
  USING (auth.uid() = uploaded_by);

-- Add RLS policies for analytics
ALTER TABLE public.study_group_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view analytics" 
  ON public.study_group_analytics 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.study_group_members sgm
      WHERE sgm.study_group_id = study_group_analytics.study_group_id 
      AND sgm.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert analytics" 
  ON public.study_group_analytics 
  FOR INSERT 
  WITH CHECK (true);

-- Add foreign key constraints
ALTER TABLE public.session_participants 
ADD CONSTRAINT session_participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.study_materials 
ADD CONSTRAINT study_materials_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_session_participants_session_id ON public.session_participants(session_id);
CREATE INDEX idx_session_participants_user_id ON public.session_participants(user_id);
CREATE INDEX idx_study_materials_group_id ON public.study_materials(study_group_id);
CREATE INDEX idx_study_materials_uploaded_by ON public.study_materials(uploaded_by);
CREATE INDEX idx_study_group_analytics_group_id ON public.study_group_analytics(study_group_id);
CREATE INDEX idx_study_group_analytics_metric_type ON public.study_group_analytics(metric_type);

-- Create function to update session attendance count
CREATE OR REPLACE FUNCTION public.update_session_participant_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update session with new participant count
    UPDATE public.study_sessions 
    SET max_participants = COALESCE(max_participants, 0)
    WHERE id = NEW.session_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Handle participant removal
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for session participant count
CREATE TRIGGER update_session_participant_count_trigger
  AFTER INSERT OR DELETE ON public.session_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_session_participant_count();

-- Create function to record analytics events
CREATE OR REPLACE FUNCTION public.record_study_group_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Record member join
    IF TG_TABLE_NAME = 'study_group_members' THEN
      INSERT INTO public.study_group_analytics (study_group_id, metric_type, metric_value)
      VALUES (NEW.study_group_id, 'member_joined', jsonb_build_object('user_id', NEW.user_id, 'role', NEW.role));
    -- Record session creation
    ELSIF TG_TABLE_NAME = 'study_sessions' THEN
      INSERT INTO public.study_group_analytics (study_group_id, metric_type, metric_value)
      VALUES (NEW.study_group_id, 'session_created', jsonb_build_object('session_id', NEW.id, 'title', NEW.title));
    -- Record material upload
    ELSIF TG_TABLE_NAME = 'study_materials' THEN
      INSERT INTO public.study_group_analytics (study_group_id, metric_type, metric_value)
      VALUES (NEW.study_group_id, 'material_uploaded', jsonb_build_object('material_id', NEW.id, 'title', NEW.title, 'uploaded_by', NEW.uploaded_by));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers for analytics
CREATE TRIGGER record_member_analytics_trigger
  AFTER INSERT ON public.study_group_members
  FOR EACH ROW EXECUTE FUNCTION public.record_study_group_analytics();

CREATE TRIGGER record_session_analytics_trigger
  AFTER INSERT ON public.study_sessions
  FOR EACH ROW EXECUTE FUNCTION public.record_study_group_analytics();

CREATE TRIGGER record_material_analytics_trigger
  AFTER INSERT ON public.study_materials
  FOR EACH ROW EXECUTE FUNCTION public.record_study_group_analytics();

-- Update study sessions table to allow updates and deletes
CREATE POLICY "Session creators can update their sessions" 
  ON public.study_sessions 
  FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Session creators can delete their sessions" 
  ON public.study_sessions 
  FOR DELETE 
  USING (auth.uid() = created_by);
