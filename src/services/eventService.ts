
import { supabase } from '@/integrations/supabase/client';

export interface Event {
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
}

export interface CreateEventData {
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

export interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: 'going' | 'maybe' | 'not_going';
  created_at: string;
  updated_at: string;
}

export class EventService {
  async getEvents(filters?: {
    startDate?: string;
    endDate?: string;
    eventType?: string;
    communityId?: string;
  }): Promise<Event[]> {
    let query = supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true });

    if (filters?.startDate) {
      query = query.gte('start_time', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('start_time', filters.endDate);
    }

    if (filters?.eventType) {
      query = query.eq('event_type', filters.eventType);
    }

    if (filters?.communityId) {
      query = query.eq('community_id', filters.communityId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      throw error;
    }

    return data || [];
  }

  async getEventById(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      return null;
    }

    return data;
  }

  async createEvent(eventData: CreateEventData): Promise<Event> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('events')
      .insert({
        ...eventData,
        created_by: user.id,
        attendee_count: 0,
        is_public: eventData.is_public ?? true,
        event_type: eventData.event_type || 'study_session',
        tags: eventData.tags || []
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      throw error;
    }

    return data;
  }

  async updateEvent(id: string, updates: Partial<CreateEventData>): Promise<Event> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('events')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('created_by', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      throw error;
    }

    return data;
  }

  async deleteEvent(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id);

    if (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  generateGoogleCalendarLink(event: Event): string {
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details: event.description || '',
      location: event.location || event.meeting_link || ''
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  generateOutlookCalendarLink(event: Event): string {
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);

    const params = new URLSearchParams({
      subject: event.title,
      startdt: startDate.toISOString(),
      enddt: endDate.toISOString(),
      body: event.description || '',
      location: event.location || event.meeting_link || ''
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }
}

export const eventService = new EventService();
