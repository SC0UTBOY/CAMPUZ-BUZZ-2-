
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedNotification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'mention' | 'message' | 'friend_request' | 'event' | 'achievement' | 'mentorship';
  title: string;
  message?: string;
  data?: any;
  is_read: boolean;
  created_at: string;
  priority: 'low' | 'medium' | 'high';
  category: 'social' | 'academic' | 'system';
}

export const useEnhancedNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<EnhancedNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  // Request push notification permission
  const requestPushPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      return permission === 'granted';
    }
    return false;
  };

  // Send push notification
  const sendPushNotification = (notification: EnhancedNotification) => {
    if (pushPermission === 'granted' && 'Notification' in window) {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        data: notification.data
      });
    }
  };

  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const enhancedNotifications: EnhancedNotification[] = (data || []).map(n => ({
        id: n.id,
        user_id: n.user_id,
        type: n.type as EnhancedNotification['type'],
        title: n.title,
        message: n.message || undefined,
        data: n.data || undefined,
        is_read: n.is_read ?? false,
        created_at: n.created_at,
        priority: getPriority(n.type),
        category: getCategory(n.type)
      }));

      setNotifications(enhancedNotifications);
      setUnreadCount(enhancedNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriority = (type: string): 'low' | 'medium' | 'high' => {
    switch (type) {
      case 'achievement':
      case 'mentorship':
        return 'high';
      case 'like':
      case 'comment':
        return 'medium';
      default:
        return 'low';
    }
  };

  const getCategory = (type: string): 'social' | 'academic' | 'system' => {
    switch (type) {
      case 'like':
      case 'comment':
      case 'message':
        return 'social';
      case 'event':
      case 'mentorship':
        return 'academic';
      default:
        return 'system';
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const createNotification = async (
    userId: string,
    type: EnhancedNotification['type'],
    title: string,
    message?: string,
    data?: any
  ) => {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data: data || {}
        })
        .select()
        .single();

      if (error) throw error;

      // Send push notification if it's for the current user
      if (userId === user?.id) {
        const enhancedNotification: EnhancedNotification = {
          id: notification.id,
          user_id: notification.user_id,
          type: notification.type as EnhancedNotification['type'],
          title: notification.title,
          message: notification.message || undefined,
          data: notification.data || undefined,
          is_read: notification.is_read ?? false,
          created_at: notification.created_at,
          priority: getPriority(notification.type),
          category: getCategory(notification.type)
        };
        sendPushNotification(enhancedNotification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('enhanced-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification: EnhancedNotification = {
            id: payload.new.id,
            user_id: payload.new.user_id,
            type: payload.new.type as EnhancedNotification['type'],
            title: payload.new.title,
            message: payload.new.message || undefined,
            data: payload.new.data || undefined,
            is_read: payload.new.is_read ?? false,
            created_at: payload.new.created_at,
            priority: getPriority(payload.new.type),
            category: getCategory(payload.new.type)
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });

          // Send push notification
          sendPushNotification(newNotification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, toast, pushPermission]);

  useEffect(() => {
    loadNotifications();
    
    // Check push permission on load
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    loading,
    pushPermission,
    markAsRead,
    markAllAsRead,
    createNotification,
    requestPushPermission,
    refetch: loadNotifications
  };
};
