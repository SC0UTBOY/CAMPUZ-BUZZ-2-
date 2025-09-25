
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeCallback = (payload: any) => void;

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private callbacks: Map<string, RealtimeCallback[]> = new Map();

  // Subscribe to posts updates with optimized filtering
  subscribeToPostUpdates(callback: RealtimeCallback): () => void {
    const channelName = 'posts-updates';
    
    if (!this.channels.has(channelName)) {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'posts'
          },
          callback
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'likes',
            filter: 'post_id=neq.null'
          },
          callback
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'comments'
          },
          callback
        )
        .subscribe();

      this.channels.set(channelName, channel);
      this.callbacks.set(channelName, []);
    }

    const callbacks = this.callbacks.get(channelName)!;
    callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      if (callbacks.length === 0) {
        const channel = this.channels.get(channelName);
        if (channel) {
          supabase.removeChannel(channel);
          this.channels.delete(channelName);
          this.callbacks.delete(channelName);
        }
      }
    };
  }

  // Subscribe to notifications
  subscribeToNotifications(userId: string, callback: RealtimeCallback): () => void {
    const channelName = `notifications-${userId}`;
    
    if (!this.channels.has(channelName)) {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          callback
        )
        .subscribe();

      this.channels.set(channelName, channel);
      this.callbacks.set(channelName, []);
    }

    const callbacks = this.callbacks.get(channelName)!;
    callbacks.push(callback);

    return () => {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      if (callbacks.length === 0) {
        const channel = this.channels.get(channelName);
        if (channel) {
          supabase.removeChannel(channel);
          this.channels.delete(channelName);
          this.callbacks.delete(channelName);
        }
      }
    };
  }

  // Subscribe to events updates
  subscribeToEventUpdates(callback: RealtimeCallback): () => void {
    const channelName = 'events-updates';
    
    if (!this.channels.has(channelName)) {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'events'
          },
          callback
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'event_rsvps'
          },
          callback
        )
        .subscribe();

      this.channels.set(channelName, channel);
      this.callbacks.set(channelName, []);
    }

    const callbacks = this.callbacks.get(channelName)!;
    callbacks.push(callback);

    return () => {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      if (callbacks.length === 0) {
        const channel = this.channels.get(channelName);
        if (channel) {
          supabase.removeChannel(channel);
          this.channels.delete(channelName);
          this.callbacks.delete(channelName);
        }
      }
    };
  }

  // Subscribe to typing indicators
  subscribeToTyping(channelId: string, callback: RealtimeCallback): () => void {
    const channelName = `typing-${channelId}`;
    
    if (!this.channels.has(channelName)) {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'typing_status',
            filter: `channel_id=eq.${channelId}`
          },
          callback
        )
        .subscribe();

      this.channels.set(channelName, channel);
      this.callbacks.set(channelName, []);
    }

    const callbacks = this.callbacks.get(channelName)!;
    callbacks.push(callback);

    return () => {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      if (callbacks.length === 0) {
        const channel = this.channels.get(channelName);
        if (channel) {
          supabase.removeChannel(channel);
          this.channels.delete(channelName);
          this.callbacks.delete(channelName);
        }
      }
    };
  }

  // Clean up all subscriptions
  cleanup(): void {
    this.channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.callbacks.clear();
  }
}

export const realtimeService = new RealtimeService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimeService.cleanup();
  });
}
