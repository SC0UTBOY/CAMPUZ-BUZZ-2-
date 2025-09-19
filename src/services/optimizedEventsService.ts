
import { supabase } from '@/integrations/supabase/client';

export interface OptimizedEvent {
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
  author: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  user_rsvp_status?: 'going' | 'maybe' | 'not_going' | null;
  is_attending: boolean;
}

class OptimizedEventsService {
  // Get events with optimized queries and proper joins
  async getEvents(filters?: {
    upcoming?: boolean;
    community_id?: string;
    attending?: boolean;
  }): Promise<OptimizedEvent[]> {
    try {
      let query = supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });

      if (filters?.upcoming) {
        query = query.gte('start_time', new Date().toISOString());
      }

      if (filters?.community_id) {
        query = query.eq('community_id', filters.community_id);
      }

      const { data: eventsData, error } = await query;
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Get profile data separately for all unique created_by IDs
      let profilesMap = new Map();
      if (eventsData && eventsData.length > 0) {
        const createdByIds = [...new Set(eventsData.map(event => event.created_by))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', createdByIds);
        
        if (profilesData) {
          profilesData.forEach(profile => {
            profilesMap.set(profile.user_id, profile);
          });
        }
      }

      // Get RSVP statuses in batch if user is authenticated
      let rsvpData: any[] = [];
      if (userId && eventsData && eventsData.length > 0) {
        const eventIds = eventsData.map(event => event.id);
        const { data } = await supabase
          .from('event_rsvps')
          .select('event_id, status')
          .eq('user_id', userId)
          .in('event_id', eventIds);
        
        rsvpData = data || [];
      }

      const rsvpMap = new Map();
      rsvpData.forEach(rsvp => {
        rsvpMap.set(rsvp.event_id, rsvp.status);
      });

      const transformedEvents = (eventsData || []).map(event => this.transformEvent(event, rsvpMap, profilesMap));

      // Filter by attendance if requested
      if (filters?.attending) {
        return transformedEvents.filter(event => event.is_attending);
      }

      return transformedEvents;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  // Create event with proper validation
  async createEvent(eventData: {
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
  }): Promise<OptimizedEvent> {
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
        .select('*')
        .single();

      if (error) throw error;

      // Get profile data separately
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .eq('user_id', user.id)
        .single();

      const profilesMap = new Map();
      if (profileData) {
        profilesMap.set(profileData.user_id, profileData);
      }

      return this.transformEvent(data, new Map(), profilesMap);
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  // RSVP to event with proper count management
  async rsvpToEvent(eventId: string, status: 'going' | 'maybe' | 'not_going'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Use upsert to handle existing RSVPs
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

      // Update attendee count - trigger will handle this automatically
      // but we can manually update for immediate consistency
      const { count } = await supabase
        .from('event_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'going');

      await supabase
        .from('events')
        .update({ attendee_count: count || 0 })
        .eq('id', eventId);

    } catch (error) {
      console.error('Error RSVPing to event:', error);
      throw error;
    }
  }

  // Get event attendees with profiles
  async getEventAttendees(eventId: string): Promise<Array<{
    user_id: string;
    display_name: string;
    avatar_url?: string;
    status: string;
    rsvp_date: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('event_rsvps')
        .select(`
          user_id,
          status,
          created_at
        `)
        .eq('event_id', eventId)
        .eq('status', 'going')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get profile data separately for attendees
      const userIds = (data || []).map(rsvp => rsvp.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map();
      (profilesData || []).forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      return (data || []).map(rsvp => ({
        user_id: rsvp.user_id,
        display_name: profilesMap.get(rsvp.user_id)?.display_name || 'Anonymous User',
        avatar_url: profilesMap.get(rsvp.user_id)?.avatar_url,
        status: rsvp.status,
        rsvp_date: rsvp.created_at
      }));
    } catch (error) {
      console.error('Error fetching event attendees:', error);
      return [];
    }
  }

  private transformEvent(dbEvent: any, rsvpMap: Map<string, string>, profilesMap: Map<string, any>): OptimizedEvent {
    const profile = profilesMap.get(dbEvent.created_by);
    const userRsvpStatus = rsvpMap.get(dbEvent.id) || null;
    
    return {
      id: dbEvent.id,
      title: dbEvent.title,
      description: dbEvent.description,
      start_time: dbEvent.start_time,
      end_time: dbEvent.end_time,
      location: dbEvent.location,
      is_virtual: dbEvent.is_virtual || false,
      meeting_link: dbEvent.meeting_link,
      max_attendees: dbEvent.max_attendees,
      attendee_count: dbEvent.attendee_count || 0,
      is_public: dbEvent.is_public !== false,
      event_type: dbEvent.event_type || 'other',
      tags: dbEvent.tags || [],
      image_url: dbEvent.image_url,
      created_by: dbEvent.created_by,
      community_id: dbEvent.community_id,
      created_at: dbEvent.created_at,
      updated_at: dbEvent.updated_at,
      author: {
        id: dbEvent.created_by,
        display_name: profile?.display_name || 'Anonymous User',
        avatar_url: profile?.avatar_url,
      },
      user_rsvp_status: userRsvpStatus as 'going' | 'maybe' | 'not_going' | null,
      is_attending: userRsvpStatus === 'going'
    };
  }
}

export const optimizedEventsService = new OptimizedEventsService();
