
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EventFormData {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  is_virtual?: boolean;
  meeting_link?: string;
  max_attendees?: number;
  is_public?: boolean;
  event_type?: string;
  tags?: string[];
  image_url?: string;
  community_id?: string;
}

export interface EventDetails {
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
  is_public: boolean;
  event_type: string;
  tags?: string[];
  image_url?: string;
  created_by: string;
  community_id?: string;
  created_at: string;
  updated_at: string;
  user_rsvp_status?: 'going' | 'maybe' | 'not_going' | null;
  is_attending: boolean;
  can_edit: boolean;
}

class EventManagementService {
  // Create a new event
  async createEvent(eventData: EventFormData): Promise<EventDetails> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          created_by: user.id,
          attendee_count: 0,
          is_public: eventData.is_public ?? true,
          event_type: eventData.event_type || 'other',
          tags: eventData.tags || []
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        user_rsvp_status: null,
        is_attending: false,
        can_edit: true
      };
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  // Get event details with user RSVP status
  async getEventDetails(eventId: string): Promise<EventDetails> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Get event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      let userRsvpStatus = null;
      if (userId) {
        const { data: rsvp } = await supabase
          .from('event_rsvps')
          .select('status')
          .eq('event_id', eventId)
          .eq('user_id', userId)
          .single();
        
        userRsvpStatus = rsvp?.status || null;
      }

      return {
        ...event,
        user_rsvp_status: userRsvpStatus as 'going' | 'maybe' | 'not_going' | null,
        is_attending: userRsvpStatus === 'going',
        can_edit: userId === event.created_by
      };
    } catch (error) {
      console.error('Error fetching event details:', error);
      throw error;
    }
  }

  // Update an event
  async updateEvent(eventId: string, updates: Partial<EventFormData>): Promise<EventDetails> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('events')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .eq('created_by', user.id) // Ensure only creator can update
        .select()
        .single();

      if (error) throw error;

      // Notify attendees of the update
      await this.notifyEventUpdate(eventId);

      return await this.getEventDetails(eventId);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  // Delete an event
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('created_by', user.id); // Ensure only creator can delete

      if (error) throw error;

      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  // RSVP to an event
  async rsvpToEvent(eventId: string, status: 'going' | 'maybe' | 'not_going'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('event_rsvps')
        .upsert({
          event_id: eventId,
          user_id: user.id,
          status
        }, {
          onConflict: 'event_id,user_id'
        });

      if (error) throw error;

      const statusText = status === 'going' ? 'attending' : status === 'maybe' ? 'maybe attending' : 'not attending';
      toast.success(`You are now ${statusText} this event`);
    } catch (error) {
      console.error('Error updating RSVP:', error);
      throw error;
    }
  }

  // Get event attendees
  async getEventAttendees(eventId: string) {
    try {
      const { data, error } = await supabase
        .from('event_rsvps')
        .select(`
          user_id,
          status,
          created_at,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(rsvp => ({
        user_id: rsvp.user_id,
        display_name: (rsvp.profiles as any)?.display_name || 'Anonymous User',
        avatar_url: (rsvp.profiles as any)?.avatar_url,
        status: rsvp.status,
        rsvp_date: rsvp.created_at
      }));
    } catch (error) {
      console.error('Error fetching event attendees:', error);
      return [];
    }
  }

  // Notify attendees of event updates
  private async notifyEventUpdate(eventId: string): Promise<void> {
    try {
      const { data: attendees } = await supabase
        .from('event_rsvps')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('status', 'going');

      const { data: event } = await supabase
        .from('events')
        .select('title')
        .eq('id', eventId)
        .single();

      if (attendees && event) {
        const notifications = attendees.map(attendee => ({
          user_id: attendee.user_id,
          title: 'Event Updated',
          message: `The event "${event.title}" has been updated.`,
          type: 'event_update',
          metadata: { event_id: eventId, event_title: event.title }
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }
    } catch (error) {
      console.error('Error notifying event update:', error);
    }
  }

  // Generate calendar export links
  generateGoogleCalendarLink(event: EventDetails): string {
    const formatGoogleDate = (date: string) => {
      return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startDate = formatGoogleDate(event.start_time);
    const endDate = formatGoogleDate(event.end_time);

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${startDate}/${endDate}`,
      details: event.description || '',
      location: event.location || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  generateOutlookCalendarLink(event: EventDetails): string {
    const params = new URLSearchParams({
      subject: event.title,
      startdt: event.start_time,
      enddt: event.end_time,
      body: event.description || '',
      location: event.location || ''
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }

  generateICSFile(event: EventDetails): string {
    const formatICSDate = (date: string) => {
      return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CampuzBuzz//Event//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@campuzbuzz.com`,
      `DTSTART:${formatICSDate(event.start_time)}`,
      `DTEND:${formatICSDate(event.end_time)}`,
      `SUMMARY:${event.title}`,
      event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
      event.location ? `LOCATION:${event.location}` : '',
      `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');

    return icsContent;
  }
}

export const eventManagementService = new EventManagementService();
