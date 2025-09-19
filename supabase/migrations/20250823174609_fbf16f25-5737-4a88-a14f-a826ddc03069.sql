
-- Add foreign key relationship between event_rsvps.user_id and profiles.user_id
ALTER TABLE public.event_rsvps 
ADD CONSTRAINT event_rsvps_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Create an index for better performance on joins
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON public.event_rsvps(user_id);
