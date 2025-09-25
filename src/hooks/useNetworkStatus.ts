
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Back online',
        description: 'Your internet connection has been restored.'
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'Connection lost',
        description: 'You\'re currently offline. Some features may be limited.',
        variant: 'destructive'
      });
    };

    const handleConnectionChange = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown');
        
        // Warn about slow connections
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          toast({
            title: 'Slow connection detected',
            description: 'Some features may load slowly due to your connection speed.',
            variant: 'default'
          });
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
      handleConnectionChange(); // Initial check
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [toast]);

  return {
    isOnline,
    connectionType,
    isSlowConnection: connectionType === 'slow-2g' || connectionType === '2g'
  };
};
