
import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { EnhancedTopBar } from './EnhancedTopBar';
import { AppSidebar } from './AppSidebar';
import { EnhancedMobileBottomNav } from './EnhancedMobileBottomNav';
import { PerformanceMonitor } from '@/components/common/PerformanceMonitor';
import { PWAInstallBanner } from '@/components/common/PWAInstallBanner';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { LoadingSkeletons } from '@/components/common/LoadingSkeletons';
import { useAuth } from '@/contexts/AuthContext';

// Lazy load page components with better error handling
const LazyComponent = ({ importFunc }: { importFunc: () => Promise<any> }) => {
  const [Component, setComponent] = React.useState<React.ComponentType | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    importFunc()
      .then((module) => {
        // Handle both default and named exports
        const ComponentToLoad = module.default || module[Object.keys(module)[0]];
        setComponent(() => ComponentToLoad);
      })
      .catch((err) => {
        console.error('Failed to load component:', err);
        setError('Failed to load page component');
      });
  }, [importFunc]);

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Loading Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!Component) {
    return <LoadingSkeletons type="feed" count={1} />;
  }

  return <Component />;
};

const EnhancedAppLayoutContent: React.FC = () => {
  const { toggleSidebar } = useSidebar();

  // Prevent pinch-to-zoom on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  };

  return (
    <>
      <div 
        className="min-h-screen bg-background flex w-full"
        onTouchStart={handleTouchStart}
      >
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <EnhancedTopBar onMobileMenuToggle={toggleSidebar} />
          
          {/* Offline/Sync Status */}
          <OfflineBanner />
          
          <main className="flex-1 p-4 pb-20 md:pb-4">
            <div className="max-w-7xl mx-auto">
              <Suspense fallback={<LoadingSkeletons type="feed" count={3} />}>
                <Routes>
                  <Route path="/" element={
                    <LazyComponent importFunc={() => import('@/pages/FastHomeFeed')} />
                  } />
                  <Route path="/chat" element={
                    <LazyComponent importFunc={() => import('@/pages/Chat')} />
                  } />
                  <Route path="/communities" element={
                    <LazyComponent importFunc={() => import('@/pages/Communities')} />
                  } />
                  <Route path="/communities/:id" element={
                    <LazyComponent importFunc={() => import('@/pages/CommunityPage')} />
                  } />
                  <Route path="/events" element={
                    <LazyComponent importFunc={() => import('@/pages/EventCalendar')} />
                  } />
                  <Route path="/profile" element={
                    <LazyComponent importFunc={() => import('@/pages/Profile')} />
                  } />
                  <Route path="/settings" element={
                    <LazyComponent importFunc={() => import('@/pages/Settings')} />
                  } />
                  <Route path="/explore" element={
                    <LazyComponent importFunc={() => import('@/pages/Explore')} />
                  } />
                  <Route path="/announcements" element={
                    <LazyComponent importFunc={() => import('@/pages/Announcements')} />
                  } />
                  <Route path="/testing" element={
                    <LazyComponent importFunc={() => import('@/pages/Testing')} />
                  } />
                  <Route path="/mentorship" element={
                    <LazyComponent importFunc={() => import('@/pages/Mentorship')} />
                  } />
                  <Route path="/documentation" element={
                    <LazyComponent importFunc={() => import('@/pages/Documentation')} />
                  } />
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </div>
          </main>
          
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <EnhancedMobileBottomNav />
          </div>
        </SidebarInset>
      </div>
      
      {/* PWA Install Prompt */}
      <PWAInstallBanner />
      
      {/* Performance Monitor (dev/performance issues only) */}
      <PerformanceMonitor />
      
      <Toaster />
    </>
  );
};

export const EnhancedAppLayout: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <EnhancedAppLayoutContent />
    </SidebarProvider>
  );
};
