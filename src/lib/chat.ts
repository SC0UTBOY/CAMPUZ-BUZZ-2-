import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Room {
    id: string;
    name: string;
    description?: string;
    is_private: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface RoomMember {
    id: string;
    room_id: string;
    user_id: string;
    role: string;
    joined_at: string;
}

export interface RoomMessage {
    id: string;
    room_id: string;
    sender_id: string;
    content: string;
    attachments?: any[];
    created_at: string;
    user_profiles?: {
        id: string;
        username?: string;
        display_name?: string;
        avatar_url?: string;
    };
}

export interface DirectMessage {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    attachments?: any[];
    is_read: boolean;
    created_at: string;
    conversation_id?: string;
    sender?: {
        id: string;
        username?: string;
        display_name?: string;
        avatar_url?: string;
    };
    user_profiles?: {
        id: string;
        username?: string;
        display_name?: string;
        avatar_url?: string;
    };
}

export interface InboxItem {
    type: 'room' | 'dm';
    id: string;
    name: string;
    last_message?: string;
    last_message_at?: string;
    avatar_url?: string;
    other_user_id?: string;
    unread_count: number;
}

// ============================================================================
// Room Management Functions
// ============================================================================

/**
 * Create a new chat room
 */
export async function createRoom(
    name: string,
    description?: string,
    isPrivate: boolean = false
): Promise<{ data: Room | null; error: any }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: new Error('User not authenticated') };
        }

        const { data, error } = await (supabase
            .from('chat_rooms') as any)
            .insert({
                name,
                description,
                is_private: isPrivate,
                created_by: user.id
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating room:', error);
            return { data: null, error };
        }

        // Add creator as a member
        await (supabase
            .from('chat_room_members') as any)
            .insert({
                room_id: data.id,
                user_id: user.id,
                role: 'admin'
            });

        return { data, error: null };
    } catch (error) {
        console.error('Error in createRoom:', error);
        return { data: null, error };
    }
}

/**
 * Join a chat room
 */
export async function joinRoom(
    roomId: string,
    userId?: string
): Promise<{ data: RoomMember | null; error: any }> {
    try {
        let targetUserId = userId;

        if (!targetUserId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { data: null, error: new Error('User not authenticated') };
            }
            targetUserId = user.id;
        }

        const { data, error } = await (supabase
            .from('chat_room_members') as any)
            .insert({
                room_id: roomId,
                user_id: targetUserId,
                role: 'member'
            })
            .select()
            .single();

        if (error) {
            console.error('Error joining room:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Error in joinRoom:', error);
        return { data: null, error };
    }
}

/**
 * Leave a chat room
 */
export async function leaveRoom(
    roomId: string,
    userId?: string
): Promise<{ data: boolean; error: any }> {
    try {
        let targetUserId = userId;

        if (!targetUserId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { data: false, error: new Error('User not authenticated') };
            }
            targetUserId = user.id;
        }

        const { error } = await (supabase
            .from('chat_room_members') as any)
            .delete()
            .eq('room_id', roomId)
            .eq('user_id', targetUserId);

        if (error) {
            console.error('Error leaving room:', error);
            return { data: false, error };
        }

        return { data: true, error: null };
    } catch (error) {
        console.error('Error in leaveRoom:', error);
        return { data: false, error };
    }
}

/**
 * Check if a user is a member of a room
 */
export async function isRoomMember(
    roomId: string,
    userId?: string
): Promise<{ data: boolean; error: any }> {
    try {
        let targetUserId = userId;

        if (!targetUserId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { data: false, error: new Error('User not authenticated') };
            }
            targetUserId = user.id;
        }

        const { data, error } = await (supabase
            .from('chat_room_members') as any)
            .select('id')
            .eq('room_id', roomId)
            .eq('user_id', targetUserId)
            .maybeSingle();

        if (error) {
            console.error('Error checking room membership:', error);
            return { data: false, error };
        }

        return { data: !!data, error: null };
    } catch (error) {
        console.error('Error in isRoomMember:', error);
        return { data: false, error };
    }
}

// ============================================================================
// Room Messaging Functions
// ============================================================================

/**
 * Send a message to a chat room
 */
export async function sendRoomMessage(
    roomId: string,
    content: string,
    attachments?: any[],
    senderId?: string
): Promise<{ data: RoomMessage | null; error: any }> {
    try {
        let targetSenderId = senderId;

        if (!targetSenderId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { data: null, error: new Error('User not authenticated') };
            }
            targetSenderId = user.id;
        }

        // Check if user is a member of the room
        const { data: isMember } = await isRoomMember(roomId, targetSenderId);
        if (!isMember) {
            return { data: null, error: new Error('User is not a member of this room') };
        }

        const { data, error } = await (supabase
            .from('chat_room_messages') as any)
            .insert({
                room_id: roomId,
                sender_id: targetSenderId,
                content,
                attachments: attachments || null
            })
            .select(`
        *,
        user_profiles:sender_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
            .single();

        if (error) {
            console.error('Error sending room message:', error);
            return { data: null, error };
        }

        return { data: data as any, error: null };
    } catch (error) {
        console.error('Error in sendRoomMessage:', error);
        return { data: null, error };
    }
}

/**
 * Fetch messages from a chat room with pagination
 */
export async function fetchRoomMessages(
    roomId: string,
    limit: number = 50,
    offset: number = 0
): Promise<{ data: RoomMessage[] | null; error: any }> {
    try {
        const { data, error } = await (supabase
            .from('chat_room_messages') as any)
            .select(`
        *,
        user_profiles:sender_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
            .eq('room_id', roomId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching room messages:', error);
            return { data: null, error };
        }

        // Reverse to show oldest first
        return { data: (data as any[]).reverse(), error: null };
    } catch (error) {
        console.error('Error in fetchRoomMessages:', error);
        return { data: null, error };
    }
}

/**
 * Fetch all rooms for the current user
 */
export async function fetchUserRooms(
    userId?: string
): Promise<{ data: Room[] | null; error: any }> {
    try {
        let targetUserId = userId;

        if (!targetUserId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { data: null, error: new Error('User not authenticated') };
            }
            targetUserId = user.id;
        }

        const { data, error } = await (supabase
            .from('chat_room_members') as any)
            .select(`
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
            .eq('user_id', targetUserId);

        if (error) {
            console.error('Error fetching user rooms:', error);
            return { data: null, error };
        }

        const rooms = data.map((item: any) => item.chat_rooms).filter(Boolean);
        return { data: rooms, error: null };
    } catch (error) {
        console.error('Error in fetchUserRooms:', error);
        return { data: null, error };
    }
}

// ============================================================================
// Direct Messaging Functions
// ============================================================================

/**
 * Send a direct message to another user
 */
export async function createDirectMessage(
    receiverId: string,
    content: string,
    attachments?: any[],
    senderId?: string
): Promise<{ data: DirectMessage | null; error: any }> {
    try {
        let targetSenderId = senderId;

        if (!targetSenderId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { data: null, error: new Error('User not authenticated') };
            }
            targetSenderId = user.id;
        }

        const { data, error } = await (supabase
            .from('direct_messages') as any)
            .insert({
                sender_id: targetSenderId,
                receiver_id: receiverId,
                content,
                attachments: attachments || null,
                is_read: false
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating direct message:', error);
            return { data: null, error };
        }

        return { data: data as any, error: null };
    } catch (error) {
        console.error('Error in createDirectMessage:', error);
        return { data: null, error };
    }
}

/**
 * Fetch direct messages with another user
 */
export async function fetchDirectMessages(
    withUserId: string,
    conversationId?: string,
    limit: number = 50,
    offset: number = 0
): Promise<{ data: DirectMessage[] | null; error: any }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: new Error('User not authenticated') };
        }

        // Fetch by sender/receiver IDs
        const { data, error } = await (supabase
            .from("direct_messages") as any)
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${withUserId}),and(sender_id.eq.${withUserId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching direct messages:', error);
            return { data: null, error };
        }

        // Reverse to show oldest first
        return { data: (data as any[]).reverse(), error: null };
    } catch (error) {
        console.error('Error in fetchDirectMessages:', error);
        return { data: null, error };
    }
}

/**
 * Mark direct messages as read
 */
export async function markMessagesAsRead(
    withUserId: string
): Promise<{ data: boolean; error: any }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: false, error: new Error('User not authenticated') };
        }

        const { error } = await (supabase
            .from('direct_messages') as any)
            .update({ is_read: true })
            .eq('sender_id', withUserId)
            .eq('receiver_id', user.id)
            .eq('is_read', false);

        if (error) {
            console.error('Error marking messages as read:', error);
            return { data: false, error };
        }

        return { data: true, error: null };
    } catch (error) {
        console.error('Error in markMessagesAsRead:', error);
        return { data: false, error };
    }
}

// ============================================================================
// Inbox Functions
// ============================================================================

/**
 * Fetch inbox with all rooms and recent DMs
 */
export async function fetchInbox(
    userId?: string
): Promise<{ data: InboxItem[] | null; error: any }> {
    try {
        let targetUserId = userId;

        if (!targetUserId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { data: null, error: new Error('User not authenticated') };
            }
            targetUserId = user.id;
        }

        const inbox: InboxItem[] = [];

        // Fetch user's rooms
        const { data: rooms, error: roomsError } = await fetchUserRooms(targetUserId);

        if (roomsError) {
            console.error('Error fetching rooms for inbox:', roomsError);
        } else if (rooms) {
            // Get last message for each room
            for (const room of rooms) {
                const { data: lastMessage } = await (supabase
                    .from('chat_room_messages') as any)
                    .select('content, created_at')
                    .eq('room_id', room.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                inbox.push({
                    type: 'room',
                    id: room.id,
                    name: room.name,
                    last_message: lastMessage?.content,
                    last_message_at: lastMessage?.created_at,
                    unread_count: 0 // TODO: Implement unread count
                });
            }
        }

        // Fetch recent DM conversations
        const { data: recentDMs, error: dmsError } = await (supabase
            .from('direct_messages') as any)
            .select('*')
            .or(`sender_id.eq.${targetUserId},receiver_id.eq.${targetUserId}`)
            .order('created_at', { ascending: false })
            .limit(50);

        if (dmsError) {
            console.error('Error fetching DMs for inbox:', dmsError);
        } else if (recentDMs) {
            // Group by conversation partner
            const conversations = new Map<string, any>();

            for (const dm of recentDMs as any[]) {
                const otherUserId = dm.sender_id === targetUserId ? dm.receiver_id : dm.sender_id;

                if (!conversations.has(otherUserId)) {
                    conversations.set(otherUserId, {
                        type: 'dm',
                        id: otherUserId,
                        name: 'User', // Will be fetched separately
                        last_message: dm.content,
                        last_message_at: dm.created_at,
                        other_user_id: otherUserId,
                        unread_count: 0 // TODO: Count unread messages
                    });
                }
            }

            inbox.push(...Array.from(conversations.values()));
        }

        // Sort by last message time
        inbox.sort((a, b) => {
            const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
            const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
            return timeB - timeA;
        });

        return { data: inbox, error: null };
    } catch (error) {
        console.error('Error in fetchInbox:', error);
        return { data: null, error };
    }
}

// ============================================================================
// File Upload Helper
// ============================================================================

/**
 * Upload an attachment to Supabase storage
 */
export async function uploadAttachment(
    file: File,
    bucket: string = 'chat-attachments'
): Promise<{ data: { url: string; name: string; size: number } | null; error: any }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { data: null, error: new Error('User not authenticated') };
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Error uploading attachment:', error);
            return { data: null, error };
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return {
            data: {
                url: publicUrl,
                name: file.name,
                size: file.size
            },
            error: null
        };
    } catch (error) {
        console.error('Error in uploadAttachment:', error);
        return { data: null, error };
    }
}
