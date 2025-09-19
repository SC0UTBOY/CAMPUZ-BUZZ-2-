
import { useState, useEffect } from 'react';
import { PushNotificationService } from '@/services/pushNotificationService';
import { useToast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: 'Notifications not supported',
        description: 'Your browser does not support push notifications.',
        variant: 'destructive'
      });
      return false;
    }

    setIsRegistering(true);
    try {
      const granted = await PushNotificationService.requestPermission();
      setPermission(Notification.permission);
      
      if (granted) {
        toast({
          title: 'Notifications enabled',
          description: 'You will now receive push notifications.'
        });
        return true;
      } else {
        toast({
          title: 'Permission denied',
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable notifications.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsRegistering(false);
    }
  };

  const showNotification = async (title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      await PushNotificationService.showNotification(title, options);
    }
  };

  return {
    isSupported,
    permission,
    isRegistering,
    requestPermission,
    showNotification
  };
};
