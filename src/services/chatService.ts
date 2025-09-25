import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Community = Database['public']['Tables']['communities']['Row'];
export type Channel = Database['public']['Tables']['community_channels']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type CommunityMember = Database['public']['Tables']['community_members']['Row'];
export type CommunityRole = Database['public']['Tables']['community_roles']['Row'];
export type DMConversation = Database['public']['Tables']['dm_conversations']['Row'];

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  url: string;
  [key: string]: any; // Index signature for Json compatibility
}

export interface MessageWithAuthor extends Omit<Message, 'attachments'> {
  author: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  reply_message?: MessageWithAuthor;
  thread_replies?: MessageWithAuthor[];
  attachments: MessageAttachment[];
}

export interface CommunityWithChannels extends Community {
  channels: Channel[];
  roles: CommunityRole[];
  member_role?: string;
  avatar_url?: string | null;
}

class ChatService {
  async editMessage(messageId: string, content: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ 
        content, 
        is_edited: true, 
        edited_at: new Date().toISOString() 
      })
      .eq('id', messageId);

    if (error) throw error;
  }

  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  }

  // Communities
  async getCommunities(): Promise<CommunityWithChannels[]> {
    const { data: communities, error } = await supabase
      .from('communities')
      .select(`
        *,
        channels:community_channels(*),
        roles:community_roles(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (communities || []).map(community => ({
      ...community,
      avatar_url: null, // Add missing field
      channels: Array.isArray(community.channels) ? community.channels : [],
      roles: Array.isArray(community.roles) ? community.roles : []
    })) as CommunityWithChannels[];
  }

  async createCommunity(name: string, description?: string): Promise<Community> {
    const { data, error } = await supabase
      .from('communities')
      .insert({ name, description, created_by: (await supabase.auth.getUser()).data.user?.id! })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async joinCommunity(communityId: string): Promise<void> {
    const { error } = await supabase
      .from('community_members')
      .insert({ 
        community_id: communityId, 
        user_id: (await supabase.auth.getUser()).data.user?.id! 
      });

    if (error) throw error;
  }

  // Channels
  async getChannels(communityId: string): Promise<Channel[]> {
    const { data, error } = await supabase
      .from('community_channels')
      .select('*')
      .eq('community_id', communityId)
      .order('position');

    if (error) throw error;
    return data;
  }

  async createChannel(communityId: string, name: string, type: 'text' | 'voice' = 'text', description?: string): Promise<Channel> {
    const { data, error } = await supabase
      .from('community_channels')
      .insert({
        community_id: communityId,
        name,
        type,
        description,
        created_by: (await supabase.auth.getUser()).data.user?.id!
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Messages
  async getMessages(channelId?: string, dmConversationId?: string): Promise<MessageWithAuthor[]> {
    const query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (channelId) {
      query.eq('channel_id', channelId);
    } else if (dmConversationId) {
      query.eq('dm_conversation_id', dmConversationId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Transform the data to match our interface
    return data.map(msg => ({
      ...msg,
      author: {
        id: msg.user_id,
        display_name: `User ${msg.user_id.slice(0, 8)}`,
        avatar_url: undefined
      },
      attachments: Array.isArray(msg.attachments) ? (msg.attachments as unknown as MessageAttachment[]) : []
    })) as MessageWithAuthor[];
  }

  async sendMessage(content: string, channelId?: string, dmConversationId?: string, replyTo?: string, attachments?: MessageAttachment[]): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        content,
        channel_id: channelId,
        dm_conversation_id: dmConversationId,
        reply_to: replyTo,
        attachments: attachments as any || [],
        user_id: (await supabase.auth.getUser()).data.user?.id!
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async reactToMessage(messageId: string, emoji: string): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id!;
    
    const { data: message } = await supabase
      .from('messages')
      .select('reactions')
      .eq('id', messageId)
      .single();

    const reactions = message?.reactions as Record<string, string[]> || {};
    
    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    const userIndex = reactions[emoji].indexOf(userId);
    if (userIndex > -1) {
      reactions[emoji].splice(userIndex, 1);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      reactions[emoji].push(userId);
    }

    const { error } = await supabase
      .from('messages')
      .update({ reactions })
      .eq('id', messageId);

    if (error) throw error;
  }

  async pinMessage(messageId: string, channelId?: string, dmConversationId?: string): Promise<void> {
    const { error } = await supabase
      .from('pinned_messages')
      .insert({
        message_id: messageId,
        channel_id: channelId,
        dm_conversation_id: dmConversationId,
        pinned_by: (await supabase.auth.getUser()).data.user?.id!
      });

    if (error) throw error;
  }

  async getDMConversations(): Promise<DMConversation[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id!;
    
    const { data, error } = await supabase
      .from('dm_conversations')
      .select('*')
      .contains('participants', [userId])
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createDMConversation(participantIds: string[], isGroup = false, name?: string): Promise<DMConversation> {
    const userId = (await supabase.auth.getUser()).data.user?.id!;
    const allParticipants = [...new Set([userId, ...participantIds])];

    const { data, error } = await supabase
      .from('dm_conversations')
      .insert({
        participants: allParticipants,
        is_group: isGroup,
        name,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async startTyping(channelId?: string, dmConversationId?: string): Promise<void> {
    const { error } = await supabase
      .from('typing_indicators')
      .upsert({
        channel_id: channelId,
        dm_conversation_id: dmConversationId,
        user_id: (await supabase.auth.getUser()).data.user?.id!,
        started_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  async stopTyping(channelId?: string, dmConversationId?: string): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id!;
    
    let query = supabase
      .from('typing_indicators')
      .delete()
      .eq('user_id', userId);

    if (channelId) {
      query = query.eq('channel_id', channelId);
    } else if (dmConversationId) {
      query = query.eq('dm_conversation_id', dmConversationId);
    }

    await query;
  }

  async startVoiceSession(channelId: string): Promise<string> {
    const sessionId = `room_${channelId}_${Date.now()}`;
    const userId = (await supabase.auth.getUser()).data.user?.id!;

    const { error } = await supabase
      .from('voice_sessions')
      .insert({
        channel_id: channelId,
        session_id: sessionId,
        started_by: userId,
        participants: [userId]
      });

    if (error) throw error;
    return sessionId;
  }

  async joinVoiceSession(sessionId: string): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id!;

    const { data: session } = await supabase
      .from('voice_sessions')
      .select('participants')
      .eq('session_id', sessionId)
      .single();

    if (session) {
      const participants = [...session.participants, userId];
      
      const { error } = await supabase
        .from('voice_sessions')
        .update({ participants })
        .eq('session_id', sessionId);

      if (error) throw error;
    }
  }

  async leaveVoiceSession(sessionId: string): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id!;

    const { data: session } = await supabase
      .from('voice_sessions')
      .select('participants')
      .eq('session_id', sessionId)
      .single();

    if (session) {
      const participants = session.participants.filter(id => id !== userId);
      
      const { error } = await supabase
        .from('voice_sessions')
        .update({ participants })
        .eq('session_id', sessionId);

      if (error) throw error;
    }
  }

  subscribeToMessages(callback: (message: MessageWithAuthor) => void, channelId?: string, dmConversationId?: string) {
    let channel = supabase
      .channel('messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: channelId ? `channel_id=eq.${channelId}` : `dm_conversation_id=eq.${dmConversationId}`
        }, 
        (payload) => {
          this.getMessages(channelId, dmConversationId).then(messages => {
            const newMessage = messages.find(m => m.id === payload.new.id);
            if (newMessage) {
              callback(newMessage);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  subscribeToTyping(callback: (users: string[]) => void, channelId?: string, dmConversationId?: string) {
    let channel = supabase
      .channel('typing')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: channelId ? `channel_id=eq.${channelId}` : `dm_conversation_id=eq.${dmConversationId}`
        },
        () => {
          let query = supabase
            .from('typing_indicators')
            .select('user_id');
          
          if (channelId) {
            query = query.eq('channel_id', channelId);
          } else if (dmConversationId) {
            query = query.eq('dm_conversation_id', dmConversationId);
          }

          query.then(({ data }) => {
            const userIds = data?.map(t => t.user_id) || [];
            callback(userIds);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const chatService = new ChatService();
