
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineData<T> {
  data: T;
  timestamp: number;
  id: string;
}

interface OfflineOptions {
  syncOnReconnect?: boolean;
  maxAge?: number; // in milliseconds
  storageKey?: string;
}

export const useOfflineSupport = <T>(
  key: string,
  options: OfflineOptions = {}
) => {
  const { toast } = useToast();
  const {
    syncOnReconnect = true,
    maxAge = 24 * 60 * 60 * 1000, // 24 hours
    storageKey = 'offline_data'
  } = options;

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState<OfflineData<T>[]>([]);
  const [pendingSync, setPendingSync] = useState<OfflineData<T>[]>([]);

  // Load offline data from storage
  useEffect(() => {
    const loadOfflineData = () => {
      try {
        const stored = localStorage.getItem(`${storageKey}_${key}`);
        if (stored) {
          const data: OfflineData<T>[] = JSON.parse(stored);
          const now = Date.now();
          
          // Filter out expired data
          const validData = data.filter(item => (now - item.timestamp) < maxAge);
          setOfflineData(validData);
        }
      } catch (error) {
        console.error('Failed to load offline data:', error);
      }
    };

    loadOfflineData();
  }, [key, storageKey, maxAge]);

  // Save data to offline storage
  const saveOffline = useCallback((data: T, id?: string) => {
    const offlineItem: OfflineData<T> = {
      data,
      timestamp: Date.now(),
      id: id || `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    setOfflineData(prev => {
      const updated = [...prev, offlineItem];
      try {
        localStorage.setItem(`${storageKey}_${key}`, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save offline data:', error);
      }
      return updated;
    });

    if (!isOnline) {
      setPendingSync(prev => [...prev, offlineItem]);
      toast({
        title: 'Saved offline',
        description: 'Your data has been saved locally and will sync when you\'re back online.'
      });
    }

    return offlineItem.id;
  }, [key, storageKey, isOnline, toast]);

  // Remove offline data
  const removeOffline = useCallback((id: string) => {
    setOfflineData(prev => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem(`${storageKey}_${key}`, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to update offline data:', error);
      }
      return updated;
    });

    setPendingSync(prev => prev.filter(item => item.id !== id));
  }, [key, storageKey]);

  // Clear all offline data
  const clearOfflineData = useCallback(() => {
    setOfflineData([]);
    setPendingSync([]);
    try {
      localStorage.removeItem(`${storageKey}_${key}`);
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }, [key, storageKey]);

  // Get offline data
  const getOfflineData = useCallback((): T[] => {
    return offlineData.map(item => item.data);
  }, [offlineData]);

  // Sync function (to be implemented by consumer)
  const sync = useCallback(async (syncFn: (data: T[]) => Promise<void>) => {
    if (pendingSync.length === 0) return;

    try {
      const dataToSync = pendingSync.map(item => item.data);
      await syncFn(dataToSync);
      
      // Remove synced data
      const syncedIds = pendingSync.map(item => item.id);
      setOfflineData(prev => {
        const updated = prev.filter(item => !syncedIds.includes(item.id));
        try {
          localStorage.setItem(`${storageKey}_${key}`, JSON.stringify(updated));
        } catch (error) {
          console.error('Failed to update offline data after sync:', error);
        }
        return updated;
      });
      
      setPendingSync([]);
      
      toast({
        title: 'Data synced',
        description: `Successfully synced ${dataToSync.length} offline items.`
      });
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: 'Sync failed',
        description: 'Failed to sync offline data. Will retry when connection improves.',
        variant: 'destructive'
      });
    }
  }, [pendingSync, key, storageKey, toast]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (syncOnReconnect && pendingSync.length > 0) {
        toast({
          title: 'Back online',
          description: `You have ${pendingSync.length} items ready to sync.`
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'You\'re offline',
        description: 'Your changes will be saved locally and synced when you reconnect.',
        variant: 'destructive'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOnReconnect, pendingSync.length, toast]);

  return {
    isOnline,
    offlineData: getOfflineData(),
    pendingSync: pendingSync.length,
    saveOffline,
    removeOffline,
    clearOfflineData,
    sync
  };
};
