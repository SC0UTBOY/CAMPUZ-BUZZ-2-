
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ChatRoom = Database['public']['Tables']['chat_rooms']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type ChatParticipant = Database['public']['Tables']['chat_participants']['Row'];
export type TypingStatus = Database['public']['Tables']['typing_status']['Row'];

export interface MessageWithAuthor extends ChatMessage {
  author: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface RoomWithParticipants extends ChatRoom {
  participants: ChatParticipant[];
  unread_count?: number;
  last_message?: MessageWithAuthor;
}

class RealtimeChatService {
  // Get all rooms for the current user
  async getUserRooms(): Promise<RoomWithParticipants[]> {
    const { data: rooms, error } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        participants:chat_participants(*)
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return rooms as RoomWithParticipants[];
  }

  // Create a new chat room
  async createRoom(name: string, description?: string, isPrivate: boolean = false): Promise<ChatRoom> {
    const { data: room, error } = await supabase
      .from('chat_rooms')
      .insert({
        name,
        description,
        is_private: isPrivate,
        created_by: (await supabase.auth.getUser()).data.user?.id!
      })
      .select()
      .single();

    if (error) throw error;

    // Add creator as participant
    await this.joinRoom(room.id);
    
    return room;
  }

  // Join a room
  async joinRoom(roomId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_participants')
      .insert({
        room_id: roomId,
        user_id: (await supabase.auth.getUser()).data.user?.id!
      });

    if (error) throw error;
  }

  // Leave a room
  async leaveRoom(roomId: string): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id!;
    const { error } = await supabase
      .from('chat_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Get messages for a room
  async getRoomMessages(roomId: string, limit: number = 50): Promise<MessageWithAuthor[]> {
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Get user profiles for message authors
    const userIds = [...new Set(messages.map(m => m.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds);

    return messages.map(msg => ({
      ...msg,
      author: {
        id: msg.user_id,
        display_name: profiles?.find(p => p.user_id === msg.user_id)?.display_name || 'Unknown User',
        avatar_url: profiles?.find(p => p.user_id === msg.user_id)?.avatar_url
      }
    })).reverse() as MessageWithAuthor[];
  }

  // Send a message
  async sendMessage(roomId: string, content: string, replyTo?: string): Promise<ChatMessage> {
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        content,
        reply_to: replyTo,
        user_id: (await supabase.auth.getUser()).data.user?.id!
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
  }

  // Start typing indicator
  async startTyping(roomId: string): Promise<void> {
    const { error } = await supabase
      .from('typing_status')
      .upsert({
        room_id: roomId,
        user_id: (await supabase.auth.getUser()).data.user?.id!,
        started_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  // Stop typing indicator
  async stopTyping(roomId: string): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id!;
    const { error } = await supabase
      .from('typing_status')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) throw error;
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
            .select('user_id, display_name, avatar_url')
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

  // Subscribe to typing indicators
  subscribeToTyping(roomId: string, callback: (typingUsers: string[]) => void) {
    const channel = supabase
      .channel(`typing-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_status',
          filter: `room_id=eq.${roomId}`
        },
        async () => {
          // Get current typing users
          const { data: typingStatuses } = await supabase
            .from('typing_status')
            .select(`
              user_id,
              profiles!inner(display_name)
            `)
            .eq('room_id', roomId)
            .gte('started_at', new Date(Date.now() - 10000).toISOString()); // Last 10 seconds

          const typingUsers = typingStatuses?.map(t => 
            (t as any).profiles.display_name
          ) || [];
          
          callback(typingUsers);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const realtimeChatService = new RealtimeChatService();
