import { useState, useEffect } from 'react';
import { fixedChatService } from '@/services/fixedChatService';

export const useChatUnreadCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchUnreadCount = async () => {
      try {
        const count = await fixedChatService.getTotalUnreadCount();
        if (mounted) {
          setUnreadCount(count);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
        if (mounted) {
          setUnreadCount(0);
          setIsLoading(false);
        }
      }
    };

    fetchUnreadCount();

    // Subscribe to real-time updates
    const unsubscribe = fixedChatService.subscribeToRooms(() => {
      fetchUnreadCount();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { unreadCount, isLoading };
};
