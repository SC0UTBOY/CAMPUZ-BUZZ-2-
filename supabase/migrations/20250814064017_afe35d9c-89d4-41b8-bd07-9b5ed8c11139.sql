
-- Add indexes for better event query performance
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_community_id ON events(community_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_public_start_time ON events(is_public, start_time) WHERE is_public = true;

-- Add indexes for event_rsvps table
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_status ON event_rsvps(status);

-- Add attendee count to events table for better performance
ALTER TABLE events ADD COLUMN IF NOT EXISTS attendee_count INTEGER DEFAULT 0;

-- Create function to update attendee count
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events 
    SET attendee_count = (
      SELECT COUNT(*) 
      FROM event_rsvps 
      WHERE event_id = NEW.event_id AND status = 'going'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE events 
    SET attendee_count = (
      SELECT COUNT(*) 
      FROM event_rsvps 
      WHERE event_id = NEW.event_id AND status = 'going'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events 
    SET attendee_count = (
      SELECT COUNT(*) 
      FROM event_rsvps 
      WHERE event_id = OLD.event_id AND status = 'going'
    )
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for attendee count updates
DROP TRIGGER IF EXISTS trigger_update_attendee_count ON event_rsvps;
CREATE TRIGGER trigger_update_attendee_count
  AFTER INSERT OR UPDATE OR DELETE ON event_rsvps
  FOR EACH ROW EXECUTE FUNCTION update_event_attendee_count();

-- Add calendar sync fields to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS outlook_calendar_id TEXT;

-- Create event notifications table
CREATE TABLE IF NOT EXISTS event_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('reminder_24h', 'reminder_1h', 'reminder_15m', 'event_updated', 'event_cancelled')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for event notifications
CREATE INDEX IF NOT EXISTS idx_event_notifications_event_id ON event_notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_event_notifications_user_id ON event_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_event_notifications_scheduled ON event_notifications(scheduled_for) WHERE sent_at IS NULL;

-- RLS policies for event notifications
ALTER TABLE event_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own event notifications" 
  ON event_notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage event notifications" 
  ON event_notifications 
  FOR ALL 
  USING (true);

-- Enable realtime for event_rsvps
ALTER TABLE event_rsvps REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE event_rsvps;

-- Enable realtime for events
ALTER TABLE events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
