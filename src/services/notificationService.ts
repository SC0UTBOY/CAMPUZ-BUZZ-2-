import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

export class NotificationService {
  // Create a new notification
  static async createNotification(
    userId: string,
    type: string,
    title: string,
    message?: string,
    data?: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Get user notifications
  static async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Get unread count
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Subscribe to real-time notifications
  static subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => callback(payload.new as Notification)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Helper methods for common notification types
  static async notifyNewLike(postAuthorId: string, likerName: string, postTitle: string): Promise<void> {
    await this.createNotification(
      postAuthorId,
      'like',
      'New Like',
      `${likerName} liked your post: ${postTitle}`,
      { type: 'like' }
    );
  }

  static async notifyNewComment(postAuthorId: string, commenterName: string, postTitle: string): Promise<void> {
    await this.createNotification(
      postAuthorId,
      'comment',
      'New Comment',
      `${commenterName} commented on your post: ${postTitle}`,
      { type: 'comment' }
    );
  }

  static async notifyMentorshipMatch(userId: string, mentorName: string): Promise<void> {
    await this.createNotification(
      userId,
      'mentorship',
      'New Mentor Match',
      `You've been matched with ${mentorName} as your mentor!`,
      { type: 'mentorship' }
    );
  }

  static async notifyGroupInvite(userId: string, groupName: string, inviterName: string): Promise<void> {
    await this.createNotification(
      userId,
      'group_invite',
      'Group Invitation',
      `${inviterName} invited you to join ${groupName}`,
      { type: 'group_invite' }
    );
  }
}