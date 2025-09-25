
import { supabase } from '@/integrations/supabase/client';

export interface EnhancedEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  is_virtual: boolean;
  meeting_link?: string;
  max_attendees?: number;
  attendee_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  image_url?: string;
  is_attending: boolean;
  event_type: string;
}

export interface EventCreateData {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  is_virtual?: boolean;
  meeting_link?: string;
  max_attendees?: number;
  tags?: string[];
  image_url?: string;
  event_type?: string;
}

class EnhancedEventService {
  // Get events with RSVP status
  async getEvents(filters?: { upcoming?: boolean; attending?: boolean }): Promise<EnhancedEvent[]> {
    try {
      let query = supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });

      if (filters?.upcoming) {
        query = query.gte('start_time', new Date().toISOString());
      }

      const { data: eventsData, error } = await query;

      if (error) throw error;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Get RSVP status for each event
      const eventsWithRSVP = await Promise.all(
        (eventsData || []).map(async (event) => {
          let is_attending = false;
          
          if (userId && filters?.attending) {
            // Check RSVP status using event_rsvps table
            const { data: rsvp } = await supabase
              .from('event_rsvps')
              .select('id')
              .eq('event_id', event.id)
              .eq('user_id', userId)
              .eq('status', 'going')
              .single();
            
            is_attending = !!rsvp;
          }

          return {
            ...event,
            is_attending
          } as EnhancedEvent;
        })
      );

      return eventsWithRSVP;
    } catch (error) {
      console.error('Error in getEvents:', error);
      throw error;
    }
  }

  // Create event
  async createEvent(eventData: EventCreateData): Promise<EnhancedEvent> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          start_time: eventData.start_time,
          end_time: eventData.end_time,
          location: eventData.location,
          is_virtual: eventData.is_virtual || false,
          meeting_link: eventData.meeting_link,
          max_attendees: eventData.max_attendees,
          tags: eventData.tags,
          image_url: eventData.image_url,
          event_type: eventData.event_type || 'other',
          created_by: user.id,
          attendee_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        is_attending: false
      } as EnhancedEvent;
    } catch (error) {
      console.error('Error in createEvent:', error);
      throw error;
    }
  }

  // RSVP to event
  async rsvpToEvent(eventId: string, status: 'going' | 'maybe' | 'not_going'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if RSVP already exists
      const { data: existingRSVP } = await supabase
        .from('event_rsvps')
        .select('id, status')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      if (existingRSVP) {
        // Update existing RSVP
        const { error } = await supabase
          .from('event_rsvps')
          .update({ status })
          .eq('id', existingRSVP.id);

        if (error) throw error;
      } else {
        // Create new RSVP
        const { error } = await supabase
          .from('event_rsvps')
          .insert({
            event_id: eventId,
            user_id: user.id,
            status
          });

        if (error) throw error;
      }

      // Update attendee count
      await this.updateAttendeeCount(eventId);
    } catch (error) {
      console.error('Error in rsvpToEvent:', error);
      throw error;
    }
  }

  // Update attendee count
  private async updateAttendeeCount(eventId: string): Promise<void> {
    try {
      // Count attending users
      const { count } = await supabase
        .from('event_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'going');

      // Update event with new count
      const { error } = await supabase
        .from('events')
        .update({ attendee_count: count || 0 })
        .eq('id', eventId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating attendee count:', error);
    }
  }

  // Generate calendar export
  generateICSExport(event: EnhancedEvent): string {
    const formatDate = (date: string) => {
      return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Your App//Event//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@yourapp.com`,
      `DTSTART:${formatDate(event.start_time)}`,
      event.end_time ? `DTEND:${formatDate(event.end_time)}` : '',
      `SUMMARY:${event.title}`,
      event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
      event.location ? `LOCATION:${event.location}` : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');

    return icsContent;
  }

  // Generate Google Calendar link
  generateGoogleCalendarLink(event: EnhancedEvent): string {
    const formatGoogleDate = (date: string) => {
      return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startDate = formatGoogleDate(event.start_time);
    const endDate = event.end_time ? formatGoogleDate(event.end_time) : startDate;

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${startDate}/${endDate}`,
      details: event.description || '',
      location: event.location || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }
}

export const enhancedEventService = new EnhancedEventService();
