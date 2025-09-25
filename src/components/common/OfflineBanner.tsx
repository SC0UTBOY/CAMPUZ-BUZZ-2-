
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi, Clock } from 'lucide-react';
import { useOfflineSupport } from '@/hooks/useOfflineSupport';

export const OfflineBanner: React.FC = () => {
  const { isOnline, pendingSync } = useOfflineSupport('app');

  if (isOnline && pendingSync === 0) {
    return null;
  }

  return (
    <div className="fixed top-16 left-4 right-4 z-40 md:left-auto md:right-4 md:max-w-sm">
      <Alert variant={isOnline ? "default" : "destructive"}>
        {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <AlertDescription>
          {!isOnline ? (
            "You're offline. Changes will be saved locally."
          ) : pendingSync > 0 ? (
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              {pendingSync} items ready to sync
            </div>
          ) : null}
        </AlertDescription>
      </Alert>
    </div>
  );
};
