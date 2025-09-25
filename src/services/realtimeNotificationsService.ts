
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RealtimeNotification {
  id: string;
  type: 'like' | 'comment' | 'mention' | 'message' | 'friend_request' | 'event' | 'community';
  title: string;
  message: string;
  data: any;
  user_id: string;
  created_at: string;
}

class RealtimeNotificationsService {
  private subscriptions = new Map<string, any>();

  // Subscribe to real-time notifications for a user
  subscribeToUserNotifications(userId: string, onNotification: (notification: RealtimeNotification) => void) {
    const channelName = `user-notifications-${userId}`;
    
    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName);
    }

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
        (payload) => {
          const notification = payload.new as RealtimeNotification;
          onNotification(notification);
          
          // Show browser notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico',
              tag: notification.id
            });
          }
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  // Subscribe to post reactions and comments
  subscribeToPostUpdates(postId: string, onUpdate: (update: any) => void) {
    const channelName = `post-updates-${postId}`;
    
    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_reactions',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          onUpdate({ type: 'reaction', payload });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          onUpdate({ type: 'comment', payload });
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  // Subscribe to all posts for feed updates
  subscribeToFeedUpdates(onUpdate: (update: any) => void) {
    const channelName = 'feed-updates';
    
    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          onUpdate({ type: 'new_post', payload });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          onUpdate({ type: 'post_update', payload });
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  // Create notification
  async createNotification(
    userId: string,
    type: RealtimeNotification['type'],
    title: string,
    message: string,
    data?: any
  ) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data: data || {}
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Unsubscribe from a channel
  unsubscribe(channelName: string) {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.subscriptions.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }
}

export const realtimeNotificationsService = new RealtimeNotificationsService();
