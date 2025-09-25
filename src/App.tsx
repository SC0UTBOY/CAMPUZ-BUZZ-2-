
import React, { Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import { SecurityMonitor } from '@/components/security/SecurityMonitor';
import { PerformanceMonitor } from '@/components/common/PerformanceMonitor';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { LoadingSkeletons } from '@/components/common/LoadingSkeletons';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on certain errors
        if (error?.message?.includes('404') || error?.message?.includes('401')) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

function NetworkStatus() {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  if (!isOnline) {
    return (
      <div className="bg-destructive text-destructive-foreground p-2 text-center text-sm">
        You're offline. Some features may not work properly.
      </div>
    );
  }

  if (isSlowConnection) {
    return (
      <div className="bg-orange-500 text-white p-2 text-center text-sm">
        Slow connection detected. Content may load slowly.
      </div>
    );
  }

  return null;
}

function AppContent() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <SecurityMonitor />
            <PerformanceMonitor />
            <NetworkStatus />
            
            <AuthGuard>
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <LoadingSkeletons type="feed" count={1} />
                </div>
              }>
                <AppRouter />
              </Suspense>
            </AuthGuard>
            
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

function AppRouter() {
  // Import layout component dynamically to avoid circular dependencies
  const [LayoutComponent, setLayoutComponent] = React.useState<React.ComponentType | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    import('@/components/layout/EnhancedAppLayout')
      .then((module) => {
        setLayoutComponent(() => module.EnhancedAppLayout);
      })
      .catch((error) => {
        console.error('Failed to load app layout:', error);
        setLoadError('Failed to load application layout');
      });
  }, []);

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Loading Error</h1>
          <p className="text-muted-foreground mb-4">{loadError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!LayoutComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSkeletons type="feed" count={1} />
      </div>
    );
  }

  return <LayoutComponent />;
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
