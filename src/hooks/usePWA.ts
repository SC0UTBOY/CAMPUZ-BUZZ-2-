
import { useState, useEffect } from 'react';
import { pwaService } from '@/services/pwaService';

export const usePWA = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Listen for installability changes
    const unsubscribe = pwaService.onInstallabilityChange(setCanInstall);
    
    // Check initial states
    setCanInstall(pwaService.canInstall());
    setIsInstalled(pwaService.isInstalled());

    // Listen for online/offline changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = async () => {
    return await pwaService.installApp();
  };

  const requestNotificationPermission = async () => {
    return await pwaService.requestNotificationPermission();
  };

  const subscribeToPushNotifications = async () => {
    return await pwaService.subscribeToPushNotifications();
  };

  return {
    canInstall,
    isInstalled,
    isOnline,
    installApp,
    requestNotificationPermission,
    subscribeToPushNotifications
  };
};
