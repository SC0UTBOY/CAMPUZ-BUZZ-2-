
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  BellOff,
  Heart,
  MessageCircle,
  UserPlus,
  Calendar,
  Users,
  BookOpen,
  Settings,
  Check,
  X,
  MoreHorizontal
} from 'lucide-react';

export const RealTimeNotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment': return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'friend_request': return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'event': return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'community': return <Users className="h-4 w-4 text-orange-500" />;
      case 'mention': return <BookOpen className="h-4 w-4 text-indigo-500" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const filteredNotifications = notifications.filter(n =>
    filter === 'all' ? true : !n.is_read
  );

  if (loading) {
    return (
      <div className="w-80 h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-background border rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mt-3">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            className="text-xs"
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('unread')}
            className="text-xs"
          >
            Unread ({unreadCount})
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-80">
        <AnimatePresence>
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <BellOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getNotificationIcon(notification.type)}
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true
                          })}
                        </span>
                      </div>
                      
                      <p className="text-sm font-medium mt-1">
                        {notification.title}
                      </p>
                      
                      {notification.message && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={requestNotificationPermission}
          className="w-full text-xs"
        >
          Enable Browser Notifications
        </Button>
      </div>
    </div>
  );
};
