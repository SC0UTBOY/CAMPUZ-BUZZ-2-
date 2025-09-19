import { supabase } from '@/integrations/supabase/client';

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  reply_to?: string;
  created_at: string;
  updated_at: string;
}

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

class ImprovedChatService {
  // Check if chat tables exist
  async checkChatTables(): Promise<{ exists: boolean; missing: string[] }> {
    try {
      const { data, error } = await supabase.rpc('check_table_exists', { 
        table_names: ['chat_rooms', 'chat_participants', 'chat_messages'] 
      });
      
      if (error) {
        // Fallback: try to query each table
        const requiredTables = ['chat_rooms', 'chat_participants', 'chat_messages'];
        const missing: string[] = [];
        
        for (const table of requiredTables) {
          try {
            await supabase.from(table).select('*').limit(0);
          } catch {
            missing.push(table);
          }
        }
        
        return { exists: missing.length === 0, missing };
      }
      
      return { exists: true, missing: [] };
    } catch (error) {
      console.error('Error checking chat tables:', error);
      return { exists: false, missing: ['chat_rooms', 'chat_participants', 'chat_messages'] };
    }
  }

  // Get all chat rooms for the current user
  async getUserRooms(): Promise<RoomWithDetails[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get rooms where user is a participant
      const { data: participations, error: participationsError } = await supabase
        .from('chat_participants')
        .select('room_id, last_read_at')
        .eq('user_id', user.id);

      if (participationsError) throw participationsError;

      if (!participations || participations.length === 0) {
        return [];
      }

      const roomIds = participations.map(p => p.room_id);

      // Get room details
      const { data: rooms, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .in('id', roomIds)
        .order('updated_at', { ascending: false });

      if (roomsError) throw roomsError;

      // Get details for each room
      const roomsWithDetails = await Promise.all(
        (rooms || []).map(async (room) => {
          // Get participants count
          const { count: participantCount } = await supabase
            .from('chat_participants')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);

          // Get unread count
          const participation = participations.find(p => p.room_id === room.id);
          const lastReadAt = participation?.last_read_at || new Date(0).toISOString();

          const { count: unreadCount } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .gt('created_at', lastReadAt);

          // Get last message with author
          const { data: lastMessageData } = await supabase
            .from('chat_messages')
            .select(`
              content,
              created_at,
              user_id
            `)
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          let lastMessage;
          if (lastMessageData) {
            // Get author profile
            const { data: authorProfile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', lastMessageData.user_id)
              .single();

            lastMessage = {
              content: lastMessageData.content,
              created_at: lastMessageData.created_at,
              author: {
                display_name: authorProfile?.display_name || 'Unknown User'
              }
            };
          }

          return {
            ...room,
            participants: [], // Will be populated if needed
            unread_count: unreadCount || 0,
            last_message: lastMessage,
            participant_count: participantCount || 0
          } as RoomWithDetails;
        })
      );

      return roomsWithDetails;
    } catch (error) {
      console.error('Error fetching user rooms:', error);
      throw error;
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
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get author profiles for all messages
      const messagesWithAuthors = await Promise.all(
        (messages || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', msg.user_id)
            .single();

          return {
            ...msg,
            author: {
              id: msg.user_id,
              display_name: profile?.display_name || 'Unknown User',
              avatar_url: profile?.avatar_url
            }
          } as MessageWithAuthor;
        })
      );

      return messagesWithAuthors.reverse();
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
          this.getUserRooms().then(callback).catch(console.error);
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
          this.getUserRooms().then(callback).catch(console.error);
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
          try {
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
          } catch (error) {
            console.error('Error processing new message:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const improvedChatService = new ImprovedChatService();
