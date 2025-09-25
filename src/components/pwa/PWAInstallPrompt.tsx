
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download, Smartphone } from 'lucide-react';
import { pwaService } from '@/services/pwaService';

export const PWAInstallPrompt: React.FC = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const unsubscribe = pwaService.onInstallabilityChange((installable) => {
      setCanInstall(installable);
      if (installable && !pwaService.isInstalled()) {
        // Show prompt after a delay
        setTimeout(() => setShowPrompt(true), 3000);
      }
    });

    // Check initial state
    setCanInstall(pwaService.canInstall());

    return unsubscribe;
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const success = await pwaService.installApp();
      if (success) {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (pwaService.isInstalled() || 
      sessionStorage.getItem('pwa-prompt-dismissed') || 
      !canInstall || 
      !showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
      >
        <Card className="p-4 bg-background/95 backdrop-blur-xl border-primary/20 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">
                Install CampuzBuzz
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Add to your home screen for quick access and offline features
              </p>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  disabled={installing}
                  className="text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  {installing ? 'Installing...' : 'Install'}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-xs"
                >
                  Not now
                </Button>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="p-1 h-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
