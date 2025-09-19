
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { optimizedEventsService, OptimizedEvent } from '@/services/optimizedEventsService';
import { useToast } from '@/hooks/use-toast';

export const useOptimizedEvents = (filters?: {
  upcoming?: boolean;
  community_id?: string;
  attending?: boolean;
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<OptimizedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const eventsData = await optimizedEventsService.getEvents(filters);
      setEvents(eventsData);
    } catch (err) {
      console.error('Error loading events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
      toast({
        title: "Error loading events",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast, user]);

  const handleRSVP = useCallback(async (eventId: string, status: 'going' | 'maybe' | 'not_going') => {
    if (!user) return;

    try {
      // Optimistic update
      setEvents(prev => prev.map(event => {
        if (event.id === eventId) {
          const wasAttending = event.is_attending;
          const isNowAttending = status === 'going';
          
          return {
            ...event,
            user_rsvp_status: status,
            is_attending: isNowAttending,
            attendee_count: wasAttending && !isNowAttending 
              ? Math.max(0, event.attendee_count - 1)
              : !wasAttending && isNowAttending
              ? event.attendee_count + 1
              : event.attendee_count
          };
        }
        return event;
      }));

      await optimizedEventsService.rsvpToEvent(eventId, status);
      
      toast({
        title: "RSVP updated",
        description: `You are now ${status === 'going' ? 'attending' : status === 'maybe' ? 'maybe attending' : 'not attending'} this event.`
      });
    } catch (error) {
      console.error('Error updating RSVP:', error);
      // Revert optimistic update
      loadEvents();
      toast({
        title: "Error",
        description: "Failed to update RSVP status",
        variant: "destructive"
      });
    }
  }, [user, loadEvents, toast]);

  const handleCreateEvent = useCallback(async (eventData: {
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
  }) => {
    try {
      const newEvent = await optimizedEventsService.createEvent(eventData);
      setEvents(prev => [newEvent, ...prev].sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      ));
      toast({
        title: "Event created!",
        description: "Your event has been created successfully."
      });
      return newEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error creating event",
        description: "Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  useEffect(() => {
    // Add a small delay to prevent rapid calls
    const timeoutId = setTimeout(() => {
      loadEvents();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [loadEvents]);

  return {
    events,
    loading,
    error,
    refresh: loadEvents,
    handleRSVP,
    handleCreateEvent
  };
};
