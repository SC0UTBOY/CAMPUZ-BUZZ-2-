
-- Create analytics_events table for tracking user interactions
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting analytics events (system can insert)
CREATE POLICY "System can insert analytics events" 
  ON public.analytics_events 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy for viewing analytics events (users can view their own, admins can view all)
CREATE POLICY "Users can view their own analytics events" 
  ON public.analytics_events 
  FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
