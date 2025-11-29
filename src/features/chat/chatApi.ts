// WhatsApp-style Chat API Layer
// Handles all chat operations using chat_rooms, chat_participants, and chat_messages tables

import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
    ChatRoom,
    ChatMessage,
    MessageWithSender,
    RoomWithLastMessage,
    CreateGroupRoomPayload,
    SendMessagePayload,
    UserSearchResult,
} from './chatTypes';

/**
 * Get the currently authenticated user
 */
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) throw new Error('User not authenticated');
    return user;
}

/**
 * List all rooms where the current user is a participant
 * Includes last message preview and unread count
 */
export async function listUserRooms(): Promise<RoomWithLastMessage[]> {
    const user = await getCurrentUser();

    // Get all rooms where user is a participant
    const { data: participantData, error: participantError } = await supabase
        .from('chat_participants')
        .select(`
      room_id,
      last_read_at,
      chat_rooms (
        id,
        name,
        description,
        is_private,
        created_by,
        created_at,
        updated_at
      )
    `)
        .eq('user_id', user.id);

    if (participantError) throw participantError;
    if (!participantData) return [];

    // For each room, get last message and unread count
    const roomsWithData = await Promise.all(
        participantData.map(async (participant: any) => {
            const room = participant.chat_rooms;
            if (!room) return null;

            // Get last message
            const { data: lastMessage } = await supabase
                .from('chat_messages')
                .select('content, created_at, attachments')
                .eq('room_id', room.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            // Get unread count
            const lastReadAt = participant.last_read_at || new Date(0).toISOString();
            const { count: unreadCount } = await supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('room_id', room.id)
                .gt('created_at', lastReadAt)
                .neq('user_id', user.id);

            // Get other participants for display
            const { data: participants } = await supabase
                .from('chat_participants')
                .select(`
          user_id,
          role,
          profiles (
            display_name,
            avatar_url
          )
        `)
                .eq('room_id', room.id);

            // Determine message type from attachments
            let messageType: 'text' | 'image' | 'file' | null = null;
            let displayMessage = lastMessage?.content || null;

            if (lastMessage?.attachments) {
                try {
                    const attachments = JSON.parse(lastMessage.attachments as any);
                    if (Array.isArray(attachments) && attachments.length > 0) {
                        const firstAttachment = attachments[0];
                        if (firstAttachment.type?.startsWith('image/')) {
                            messageType = 'image';
                            displayMessage = '📷 Photo';
                        } else {
                            messageType = 'file';
                            displayMessage = '📎 File';
                        }
                    }
                } catch (e) {
                    // Invalid JSON, treat as text
                }
            }

            return {
                ...room,
                last_message: displayMessage,
                last_message_time: lastMessage?.created_at || null,
                last_message_type: messageType,
                unread_count: unreadCount || 0,
                participants: participants?.map((p: any) => ({
                    user_id: p.user_id,
                    display_name: p.profiles?.display_name || null,
                    avatar_url: p.profiles?.avatar_url || null,
                    role: p.role,
                })) || [],
            } as RoomWithLastMessage;
        })
    );

    return roomsWithData.filter((room): room is RoomWithLastMessage => room !== null);
}

/**
 * Create a new group chat room
 * Step 1: Insert into chat_rooms
 * Step 2: Insert creator into chat_participants
 */
export async function createGroupRoom(payload: CreateGroupRoomPayload): Promise<ChatRoom> {
    const user = await getCurrentUser();

    // Step 1: Create the room
    const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
            name: payload.name,
            description: payload.description || null,
            is_private: payload.isPrivate || false,
            created_by: user.id,
        })
        .select()
        .single();

    if (roomError) throw roomError;
    if (!room) throw new Error('Failed to create room');

    // Step 2: Add creator as participant
    const { error: participantError } = await supabase
        .from('chat_participants')
        .insert({
            room_id: room.id,
            user_id: user.id,
            role: 'admin',
        });

    if (participantError) {
        // Rollback: delete the room if participant insert fails
        await supabase.from('chat_rooms').delete().eq('id', room.id);
        throw participantError;
    }

    return room;
}

/**
 * Find existing DM or create a new one
 * DMs are identified by having exactly 2 participants and is_private = true
 */
export async function findOrCreateDirectMessage(otherUserId: string): Promise<ChatRoom> {
    const user = await getCurrentUser();

    // Sort user IDs for deterministic lookup
    const [userId1, userId2] = [user.id, otherUserId].sort();

    // Find existing DM room with exactly these 2 participants
    const { data: existingParticipants } = await supabase
        .from('chat_participants')
        .select('room_id, chat_rooms!inner(id, name, description, is_private, created_by, created_at, updated_at)')
        .or(`user_id.eq.${userId1},user_id.eq.${userId2}`);

    if (existingParticipants) {
        // Group by room_id and find rooms with exactly 2 participants
        const roomCounts = new Map<string, { count: number; room: any }>();

        for (const participant of existingParticipants) {
            const roomId = participant.room_id;
            if (!roomId) continue;

            const existing = roomCounts.get(roomId);
            if (existing) {
                existing.count++;
            } else {
                roomCounts.set(roomId, { count: 1, room: participant.chat_rooms });
            }
        }

        // Find a room with exactly 2 participants
        for (const [roomId, { count, room }] of roomCounts.entries()) {
            if (count === 2) {
                // Verify this room has no other participants
                const { count: totalCount } = await supabase
                    .from('chat_participants')
                    .select('*', { count: 'exact', head: true })
                    .eq('room_id', roomId);

                if (totalCount === 2) {
                    return room;
                }
            }
        }
    }

    // No existing DM found, create a new one
    // Get other user's display name for room name
    const { data: otherUserProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', otherUserId)
        .single();

    const roomName = otherUserProfile?.display_name || 'Direct Message';

    // Step 1: Create the room
    const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
            name: roomName,
            description: null,
            is_private: true,
            created_by: user.id,
        })
        .select()
        .single();

    if (roomError) throw roomError;
    if (!room) throw new Error('Failed to create DM room');

    // Step 2: Add both participants
    const { error: participantError } = await supabase
        .from('chat_participants')
        .insert([
            { room_id: room.id, user_id: user.id, role: 'member' },
            { room_id: room.id, user_id: otherUserId, role: 'member' },
        ]);

    if (participantError) {
        // Rollback: delete the room if participant insert fails
        await supabase.from('chat_rooms').delete().eq('id', room.id);
        throw participantError;
    }

    return room;
}

/**
 * Fetch messages for a room with sender information
 */
export async function fetchMessages(roomId: string): Promise<MessageWithSender[]> {
    const { data, error } = await supabase
        .from('chat_messages')
        .select(`
            id,
            room_id,
            user_id,
            content,
            message_type,
            attachments,
            reply_to,
            created_at,
            profiles:profiles!inner (
                id,
                display_name,
                avatar_url,
                username
            )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return data.map((msg: any) => ({
        ...msg,
        sender: {
            user_id: msg.profiles?.id || msg.user_id,
            display_name: msg.profiles?.display_name || null,
            avatar_url: msg.profiles?.avatar_url || null,
        },
    }));
}

/**
 * Send a text message or message with file attachment
 */
export async function sendMessage(payload: SendMessagePayload): Promise<ChatMessage> {
    const user = await getCurrentUser();

    let attachments: any[] = [];
    let messageType: 'text' | 'image' | 'file' = 'text';

    // Handle image upload
    if (payload.imageFile) {
        const fileExt = payload.imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('chat-uploads')
            .upload(filePath, payload.imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('chat-uploads')
            .getPublicUrl(filePath);

        attachments.push({
            type: payload.imageFile.type,
            url: publicUrl,
            name: payload.imageFile.name,
            size: payload.imageFile.size,
        });

        messageType = 'image';
    }

    // Handle document upload
    if (payload.documentFile) {
        const fileExt = payload.documentFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('chat-uploads')
            .upload(filePath, payload.documentFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('chat-uploads')
            .getPublicUrl(filePath);

        attachments.push({
            type: payload.documentFile.type,
            url: publicUrl,
            name: payload.documentFile.name,
            size: payload.documentFile.size,
        });

        messageType = 'file';
    }

    // Insert message
    const { data: message, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
            room_id: payload.roomId,
            user_id: user.id,
            content: payload.content,
            message_type: messageType,
            reply_to: payload.replyTo || null,
            attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
        })
        .select()
        .single();

    if (messageError) throw messageError;
    if (!message) throw new Error('Failed to send message');

    return message;
}

/**
 * Subscribe to new messages in a room
 */
export function subscribeToRoomMessages(
    roomId: string,
    callback: (message: MessageWithSender) => void
): () => void {
    const channel = supabase
        .channel(`room:${roomId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'chat_messages',
                filter: `room_id=eq.${roomId}`,
            },
            async (payload) => {
                // Only handle INSERT events for new messages
                if (payload.eventType !== 'INSERT') return;

                // Fetch sender info for the new message
                const { data: senderProfile } = await supabase
                    .from('profiles')
                    .select('id, display_name, avatar_url, username')
                    .eq('user_id', payload.new.user_id)
                    .single();

                const messageWithSender: MessageWithSender = {
                    ...(payload.new as ChatMessage),
                    sender: {
                        user_id: senderProfile?.id || payload.new.user_id,
                        display_name: senderProfile?.display_name || null,
                        avatar_url: senderProfile?.avatar_url || null,
                    },
                };

                callback(messageWithSender);
            }
        )
        .subscribe();

    // Return unsubscribe function
    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * Mark a room as read by updating last_read_at
 */
export async function markRoomRead(roomId: string): Promise<void> {
    const user = await getCurrentUser();

    const { error } = await supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', user.id);

    if (error) throw error;
}

/**
 * Search users by display name or username
 */
export async function searchUsers(query: string): Promise<UserSearchResult[]> {
    const user = await getCurrentUser();

    if (!query.trim()) return [];

    const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, username')
        .neq('user_id', user.id)
        .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(10);

    if (error) throw error;
    return data || [];
}

/**
 * Delete a message by ID
 */
export async function deleteMessage(messageId: string): Promise<{ success: boolean; error?: any }> {
    const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

    if (error) {
        console.error('Delete message failed:', error);
        return { success: false, error };
    }

    return { success: true };
}
