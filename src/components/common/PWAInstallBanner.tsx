
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export const PWAInstallBanner: React.FC = () => {
  const { canInstall, isInstalled, installApp } = usePWA();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner
    const isDismissed = localStorage.getItem('pwa-install-dismissed');
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // Show banner if PWA can be installed and isn't already installed
    if (canInstall && !isInstalled) {
      // Delay showing banner to avoid interrupting initial load
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled]);

  const handleInstall = async () => {
    try {
      const result = await installApp();
      if (result) {
        setShowBanner(false);
      }
    } catch (error) {
      console.error('PWA installation failed:', error);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showBanner || dismissed || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:max-w-sm">
      <Card className="shadow-lg border-2 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Download className="h-5 w-5 text-primary" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">Install CampusBuzz</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Get the full app experience with offline access and push notifications.
              </p>
              
              <div className="flex items-center gap-2 mt-3">
                <Button size="sm" onClick={handleInstall} className="flex-1">
                  <div className="flex items-center gap-1">
                    {/Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? (
                      <Smartphone className="h-3 w-3" />
                    ) : (
                      <Monitor className="h-3 w-3" />
                    )}
                    Install
                  </div>
                </Button>
                
                <Button
                  size="sm" 
                  variant="ghost"
                  onClick={handleDismiss}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
