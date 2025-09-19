import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { eventService, Event, EventRSVP } from '@/services/eventService';
import { useAuth } from '@/contexts/AuthContext';

export const useEvents = (filters?: {
  community_id?: string;
  event_type?: string;
  upcoming_only?: boolean;
}) => {
  const [page, setPage] = useState(0);
  const limit = 10;

  // Map the filters to match what eventService expects
  const mappedFilters = filters ? {
    communityId: filters.community_id,
    eventType: filters.event_type,
    startDate: filters.upcoming_only ? new Date().toISOString() : undefined,
  } : undefined;

  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ['events', filters, page],
    queryFn: () => eventService.getEvents(mappedFilters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    events: data || [],
    total: data?.length || 0,
    isLoading,
    error,
    loadMore: () => setPage(p => p + 1),
    hasMore: false // Since we're not using pagination in the service yet
  };
};

export const useEvent = (eventId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['event', eventId, user?.id],
    queryFn: () => eventService.getEventById(eventId),
    enabled: !!eventId,
  });
};

export const useEventAttendees = (eventId: string) => {
  return useQuery({
    queryKey: ['event-attendees', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_rsvps')
        .select(`
          id,
          event_id,
          user_id,
          status,
          created_at,
          profiles:user_id (
            id,
            user_id,
            display_name,
            avatar_url
          )
        `)
        .eq('event_id', eventId);

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
};

export const useEventRSVP = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: 'going' | 'maybe' | 'not_going' }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('event_rsvps')
        .upsert({
          event_id: eventId,
          user_id: user.id,
          status: status
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-attendees', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useEventRealtime = (eventId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!eventId) return;

    // Subscribe to RSVP changes
    const rsvpChannel = supabase
      .channel('event-rsvps')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_rsvps',
          filter: `event_id=eq.${eventId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['event', eventId] });
          queryClient.invalidateQueries({ queryKey: ['event-attendees', eventId] });
        }
      )
      .subscribe();

    // Subscribe to event changes
    const eventChannel = supabase
      .channel('events')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['event', eventId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rsvpChannel);
      supabase.removeChannel(eventChannel);
    };
  }, [eventId, queryClient]);
};
