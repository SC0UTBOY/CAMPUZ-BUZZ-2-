// Type definitions for WhatsApp-style chat system
// Matches the Supabase schema with chat_rooms, chat_participants, and chat_messages

import { Database } from '@/integrations/supabase/types';

// Base types from database
export type ChatRoom = Database['public']['Tables']['chat_rooms']['Row'];
export type ChatParticipant = Database['public']['Tables']['chat_participants']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];

// Extended types with joined data
export interface MessageWithSender extends ChatMessage {
    sender: {
        display_name: string | null;
        avatar_url: string | null;
        user_id: string;
    };
}

export interface RoomWithLastMessage extends ChatRoom {
    last_message: string | null;
    last_message_time: string | null;
    last_message_type: 'text' | 'image' | 'file' | null;
    unread_count: number;
    participants: Array<{
        user_id: string;
        display_name: string | null;
        avatar_url: string | null;
        role: string | null;
    }>;
}

// API function payloads
export interface CreateGroupRoomPayload {
    name: string;
    description?: string;
    isPrivate?: boolean;
}

export interface SendMessagePayload {
    roomId: string;
    content: string;
    imageFile?: File;
    documentFile?: File;
    replyTo?: string;
}

// User search result
export interface UserSearchResult {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
}
