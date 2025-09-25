import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ChatRoom = Database['public']['Tables']['chat_rooms']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type ChatParticipant = Database['public']['Tables']['chat_participants']['Row'];

export interface MessageWithAuthor extends ChatMessage {
  author: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface RoomWithDetails extends ChatRoom {
  participants: Array<{
    id: string;
    user_id: string;
    joined_at: string;
    last_read_at: string;
  }>;
  unread_count: number;
  last_message?: {
    content: string;
    created_at: string;
    author: {
      display_name: string;
    };
  };
  participant_count: number;
}

class FixedChatService {
  // Get all chat rooms for the current user with unread counts and last messages
  async getUserRooms(): Promise<RoomWithDetails[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First, get rooms where user is a participant
      const { data: rooms, error: roomsError } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          participants:chat_participants!inner(
            id,
            user_id,
            joined_at,
            last_read_at
          )
        `)
        .eq('chat_participants.user_id', user.id)
        .order('updated_at', { ascending: false });

      if (roomsError) throw roomsError;

      // Get unread counts and last messages for each room
      const roomsWithDetails = await Promise.all(
        (rooms || []).map(async (room) => {
          // Get unread count
          const { data: participant } = await supabase
            .from('chat_participants')
            .select('last_read_at')
            .eq('room_id', room.id)
            .eq('user_id', user.id)
            .single();

          const lastReadAt = participant?.last_read_at || new Date(0).toISOString();

          const { count: unreadCount } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .gt('created_at', lastReadAt);

          // Get last message
          const { data: lastMessage } = await supabase
            .from('chat_messages')
            .select(`
              content,
              created_at,
              profiles!inner(display_name)
            `)
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...room,
            unread_count: unreadCount || 0,
            last_message: lastMessage ? {
              content: lastMessage.content,
              created_at: lastMessage.created_at,
              author: {
                display_name: (lastMessage as any).profiles.display_name
              }
            } : undefined,
            participant_count: Array.isArray(room.participants) ? room.participants.length : 0
          } as RoomWithDetails;
        })
      );

      return roomsWithDetails;
    } catch (error) {
      console.error('Error fetching user rooms:', error);
      throw error;
    }
  }

  // Get total unread count across all rooms
  async getTotalUnreadCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      // Get all rooms user participates in
      const { data: participations } = await supabase
        .from('chat_participants')
        .select('room_id, last_read_at')
        .eq('user_id', user.id);

      if (!participations || participations.length === 0) return 0;

      let totalUnread = 0;

      // Count unread messages for each room
      for (const participation of participations) {
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', participation.room_id)
          .gt('created_at', participation.last_read_at || new Date(0).toISOString());

        totalUnread += count || 0;
      }

      return totalUnread;
    } catch (error) {
      console.error('Error getting total unread count:', error);
      return 0;
    }
  }

  // Create a new chat room
  async createRoom(name: string, description?: string, isPrivate: boolean = false): Promise<ChatRoom> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: room, error } = await supabase
        .from('chat_rooms')
        .insert({
          name,
          description,
          is_private: isPrivate,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as participant
      await this.joinRoom(room.id);
      
      return room;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  // Join a room
  async joinRoom(roomId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('chat_participants')
        .insert({
          room_id: roomId,
          user_id: user.id
        });

      if (error && !error.message.includes('duplicate')) {
        throw error;
      }
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  }

  // Get messages for a room
  async getRoomMessages(roomId: string, limit: number = 50): Promise<MessageWithAuthor[]> {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles!inner(
            display_name,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (messages || []).map(msg => ({
        ...msg,
        author: {
          id: msg.user_id,
          display_name: (msg as any).profiles.display_name,
          avatar_url: (msg as any).profiles.avatar_url
        }
      })).reverse() as MessageWithAuthor[];
    } catch (error) {
      console.error('Error fetching room messages:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(roomId: string, content: string, replyTo?: string): Promise<ChatMessage> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          content,
          reply_to: replyTo,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Update room's updated_at timestamp
      await supabase
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', roomId);

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markAsRead(roomId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  }

  // Subscribe to room list changes
  subscribeToRooms(callback: (rooms: RoomWithDetails[]) => void) {
    const channel = supabase
      .channel('room-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms'
        },
        () => {
          this.getUserRooms().then(callback);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages'
        },
        () => {
          this.getUserRooms().then(callback);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_participants'
        },
        () => {
          this.getUserRooms().then(callback);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Subscribe to messages in a room
  subscribeToMessages(roomId: string, callback: (message: MessageWithAuthor) => void) {
    const channel = supabase
      .channel(`messages-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          // Get author profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', payload.new.user_id)
            .single();

          const messageWithAuthor: MessageWithAuthor = {
            ...payload.new as ChatMessage,
            author: {
              id: payload.new.user_id,
              display_name: profile?.display_name || 'Unknown User',
              avatar_url: profile?.avatar_url
            }
          };

          callback(messageWithAuthor);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const fixedChatService = new FixedChatService();
