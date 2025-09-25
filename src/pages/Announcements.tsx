
import React, { useState, useEffect } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CreateAnnouncementModal } from '@/components/announcements/CreateAnnouncementModal';
import { Megaphone, Plus, Pin, Calendar, Users, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'academic' | 'event' | 'urgent';
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
  createdAt: string;
  isPinned: boolean;
  tags: string[];
  viewCount: number;
}

// Mock data for announcements
const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Campus Wi-Fi Maintenance Scheduled',
    content: 'The campus network will undergo scheduled maintenance this Saturday from 2 AM to 6 AM. Please plan accordingly for any online activities during this time.',
    type: 'general',
    author: {
      name: 'IT Services',
      avatar: '',
      role: 'admin'
    },
    createdAt: '2024-01-15T10:00:00Z',
    isPinned: true,
    tags: ['maintenance', 'wifi', 'important'],
    viewCount: 234
  },
  {
    id: '2',
    title: 'Spring Semester Registration Opens',
    content: 'Registration for Spring 2024 semester opens Monday, January 22nd at 8:00 AM. Make sure to meet with your academic advisor before registering.',
    type: 'academic',
    author: {
      name: 'Registrar Office',
      avatar: '',
      role: 'admin'
    },
    createdAt: '2024-01-14T14:30:00Z',
    isPinned: true,
    tags: ['registration', 'spring2024', 'academic'],
    viewCount: 412
  }
];

export const Announcements = () => {
  const { profile } = useUserProfile();
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');

  const typeColors = {
    general: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    academic: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    event: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  };

  const filteredAnnouncements = selectedType === 'all' 
    ? announcements 
    : announcements.filter(ann => ann.type === selectedType);

  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleCreateAnnouncement = (announcementData: any) => {
    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      ...announcementData,
      author: {
        name: profile?.display_name || 'Anonymous',
        avatar: profile?.avatar_url || '',
        role: profile?.role || 'student'
      },
      createdAt: new Date().toISOString(),
      viewCount: 0
    };
    
    setAnnouncements(prev => [newAnnouncement, ...prev]);
    setShowCreateModal(false);
  };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'professor';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <Megaphone className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Campus Announcements
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Stay updated with the latest campus news and information
            </p>
          </div>
        </div>
        
        {isAdmin && (
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {['all', 'general', 'academic', 'event', 'urgent'].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              selectedType === type
                ? 'border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
            {type === 'all' && (
              <span className="ml-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-full">
                {announcements.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {sortedAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No announcements yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                There are no announcements in this category.
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedAnnouncements.map((announcement, index) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`${
                announcement.isPinned 
                  ? 'ring-2 ring-yellow-400 dark:ring-yellow-500' 
                  : 'hover:shadow-md'
              } transition-shadow`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={announcement.author.avatar} />
                        <AvatarFallback>
                          {announcement.author.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {announcement.isPinned && (
                            <Pin className="h-4 w-4 text-yellow-500" />
                          )}
                          <CardTitle className="text-lg leading-tight">
                            {announcement.title}
                          </CardTitle>
                        </div>
                        
                        <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium">{announcement.author.name}</span>
                          <span>•</span>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(announcement.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{announcement.viewCount} views</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Badge className={typeColors[announcement.type]}>
                      {announcement.type}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {announcement.content}
                  </p>
                  
                  {announcement.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {announcement.tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="text-xs"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Announcement Modal */}
      <CreateAnnouncementModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateAnnouncement}
      />
    </div>
  );
};

export default Announcements;
