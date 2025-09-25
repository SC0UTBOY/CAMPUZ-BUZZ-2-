
export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWAService {
  private deferredPrompt: PWAInstallPrompt | null = null;
  private isInstallable = false;
  private installListeners: ((canInstall: boolean) => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as any;
      this.isInstallable = true;
      this.notifyInstallListeners(true);
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isInstallable = false;
      this.notifyInstallListeners(false);
      console.log('CampuzBuzz installed successfully!');
    });

    // Register service worker
    this.registerServiceWorker();
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                this.showUpdateAvailable();
              }
            });
          }
        });

        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  private showUpdateAvailable() {
    // This could trigger a toast notification
    console.log('New version available! Please refresh.');
  }

  private notifyInstallListeners(canInstall: boolean) {
    this.installListeners.forEach(listener => listener(canInstall));
  }

  // Public methods
  async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        this.deferredPrompt = null;
        this.isInstallable = false;
        this.notifyInstallListeners(false);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error installing app:', error);
      return false;
    }
  }

  canInstall(): boolean {
    return this.isInstallable;
  }

  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  onInstallabilityChange(callback: (canInstall: boolean) => void) {
    this.installListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.installListeners = this.installListeners.filter(l => l !== callback);
    };
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlB64ToUint8Array(
          // You'll need to replace this with your actual VAPID public key
          'BEl62iUYgUivxIkv69yViEuiBIa40HI0IVYMzINb5jdXU5vJb4TTrKOvKPKj7UqWrPwc9x0-v2UAmF8J7EzOH0o'
        )
      });

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  private urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const pwaService = new PWAService();
