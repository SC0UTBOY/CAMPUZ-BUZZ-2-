
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { AuthGuard } from '@/components/auth/AuthGuard';

// Import pages
import HomeFeed from '@/pages/HomeFeed';
import { Chat } from '@/pages/Chat';
import Communities from '@/pages/Communities';
import { EventCalendar } from '@/pages/EventCalendar';
import { Announcements } from '@/pages/Announcements';
import Profile from '@/pages/Profile';
import Explore from '@/pages/Explore';
import NotFound from '@/pages/NotFound';

const AppLayoutContent: React.FC = () => {
  const { toggleSidebar } = useSidebar();

  // Prevent pinch-to-zoom on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  };

  return (
    <div 
      className="min-h-screen bg-background flex w-full"
      onTouchStart={handleTouchStart}
    >
      <AppSidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenuClick={toggleSidebar} />
            
            <main className="flex-1 overflow-auto pb-16 md:pb-0">
              <Routes>
                <Route path="/" element={<HomeFeed />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/events" element={<EventCalendar />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            
            <MobileBottomNav />
          </div>
        </div>
  );
};

export const AppLayout: React.FC = () => {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppLayoutContent />
      </SidebarProvider>
    </AuthGuard>
  );
};
