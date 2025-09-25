
import { supabase } from '@/integrations/supabase/client';

export interface PushNotificationToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'web' | 'android' | 'ios';
  created_at: string;
  last_used: string;
  is_active: boolean;
}

export class PushNotificationService {
  // Register push notification token
  static async registerToken(token: string, platform: 'web' | 'android' | 'ios'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase
        .from('push_notification_tokens')
        .upsert({
          user_id: user.id,
          token: token,
          platform: platform,
          last_used: new Date().toISOString(),
          is_active: true
        });
    } catch (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  }

  // Unregister push notification token
  static async unregisterToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase
        .from('push_notification_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('token', token);
    } catch (error) {
      console.error('Error unregistering push token:', error);
      throw error;
    }
  }

  // Get user's active tokens
  static async getUserTokens(): Promise<PushNotificationToken[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('push_notification_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_used', { ascending: false });

      if (error) throw error;
      
      // Type cast the platform field to ensure it matches our interface
      return (data || []).map(token => ({
        ...token,
        platform: token.platform as 'web' | 'android' | 'ios'
      })) as PushNotificationToken[];
    } catch (error) {
      console.error('Error fetching user tokens:', error);
      return [];
    }
  }

  // Request notification permission (web only)
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Show local notification
  static async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });
  }
}
