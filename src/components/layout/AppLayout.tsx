
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { AuthGuard } from '@/components/auth/AuthGuard';

// Import pages
import HomeFeed from '@/pages/HomeFeed';
import { Chat } from '@/pages/Chat';
import Communities from '@/pages/Communities';
import StudyGroups from '@/pages/StudyGroups';
import { EventCalendar } from '@/pages/EventCalendar';
import { Announcements } from '@/pages/Announcements';
import Profile from '@/pages/Profile';
import Explore from '@/pages/Explore';
import NotFound from '@/pages/NotFound';

export const AppLayout: React.FC = () => {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="min-h-screen bg-background flex w-full">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar />
            
            <main className="flex-1 overflow-auto pb-16 md:pb-0">
              <Routes>
                <Route path="/" element={<HomeFeed />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/study-groups" element={<StudyGroups />} />
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
      </SidebarProvider>
    </AuthGuard>
  );
};
