
-- First, let's ensure we have proper event_rsvps table with all necessary columns
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on event_rsvps
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for event_rsvps
CREATE POLICY "Users can manage their own RSVPs" ON public.event_rsvps
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Event RSVPs are visible to everyone" ON public.event_rsvps
  FOR SELECT USING (true);

-- Create notifications table for event reminders
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  metadata JSONB DEFAULT '{}',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_for TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON public.event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON public.event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_status ON public.event_rsvps(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON public.notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_community_id ON public.events(community_id);

-- Add trigger to update attendee count automatically
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events 
    SET attendee_count = (
      SELECT COUNT(*) 
      FROM public.event_rsvps 
      WHERE event_id = NEW.event_id AND status = 'going'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.events 
    SET attendee_count = (
      SELECT COUNT(*) 
      FROM public.event_rsvps 
      WHERE event_id = NEW.event_id AND status = 'going'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.events 
    SET attendee_count = (
      SELECT COUNT(*) 
      FROM public.event_rsvps 
      WHERE event_id = OLD.event_id AND status = 'going'
    )
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic attendee count updates
DROP TRIGGER IF EXISTS update_event_attendee_count_trigger ON public.event_rsvps;
CREATE TRIGGER update_event_attendee_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION update_event_attendee_count();

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to event_rsvps
DROP TRIGGER IF EXISTS update_event_rsvps_updated_at ON public.event_rsvps;
CREATE TRIGGER update_event_rsvps_updated_at
    BEFORE UPDATE ON public.event_rsvps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for events and RSVPs
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_rsvps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Set replica identity for realtime updates
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER TABLE public.event_rsvps REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Function to schedule event notifications
CREATE OR REPLACE FUNCTION schedule_event_notifications(event_id UUID)
RETURNS VOID AS $$
DECLARE
    event_record RECORD;
    attendee_record RECORD;
    notification_times TIMESTAMP WITH TIME ZONE[];
    notification_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get event details
    SELECT * INTO event_record FROM public.events WHERE id = event_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Define notification times (24h, 1h, 15min before event)
    notification_times := ARRAY[
        event_record.start_time - INTERVAL '24 hours',
        event_record.start_time - INTERVAL '1 hour',
        event_record.start_time - INTERVAL '15 minutes'
    ];
    
    -- Get all attendees who are going
    FOR attendee_record IN 
        SELECT user_id FROM public.event_rsvps 
        WHERE event_id = schedule_event_notifications.event_id AND status = 'going'
    LOOP
        -- Schedule notifications for each time
        FOREACH notification_time IN ARRAY notification_times
        LOOP
            -- Only schedule if notification time is in the future
            IF notification_time > NOW() THEN
                INSERT INTO public.notifications (
                    user_id,
                    title,
                    message,
                    type,
                    metadata,
                    scheduled_for
                ) VALUES (
                    attendee_record.user_id,
                    'Event Reminder: ' || event_record.title,
                    CASE 
                        WHEN notification_time = event_record.start_time - INTERVAL '24 hours' THEN
                            'Your event "' || event_record.title || '" is starting tomorrow at ' || 
                            TO_CHAR(event_record.start_time, 'HH24:MI')
                        WHEN notification_time = event_record.start_time - INTERVAL '1 hour' THEN
                            'Your event "' || event_record.title || '" is starting in 1 hour'
                        ELSE
                            'Your event "' || event_record.title || '" is starting in 15 minutes'
                    END,
                    'event_reminder',
                    jsonb_build_object('event_id', event_id, 'event_title', event_record.title),
                    notification_time
                );
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to trigger notification scheduling when someone RSVPs
CREATE OR REPLACE FUNCTION handle_event_rsvp_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only schedule notifications for 'going' status
    IF NEW.status = 'going' THEN
        PERFORM schedule_event_notifications(NEW.event_id);
    END IF;
    
    -- Remove notifications if user changes to not going
    IF OLD.status = 'going' AND NEW.status != 'going' THEN
        DELETE FROM public.notifications 
        WHERE user_id = NEW.user_id 
          AND type = 'event_reminder' 
          AND (metadata->>'event_id')::UUID = NEW.event_id
          AND scheduled_for > NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for RSVP notifications
DROP TRIGGER IF EXISTS event_rsvp_notification_trigger ON public.event_rsvps;
CREATE TRIGGER event_rsvp_notification_trigger
    AFTER INSERT OR UPDATE ON public.event_rsvps
    FOR EACH ROW
    EXECUTE FUNCTION handle_event_rsvp_notification();
