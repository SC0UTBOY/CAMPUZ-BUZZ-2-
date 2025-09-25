
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  content: string;
  user_id: string;
  channel_id?: string;
  dm_conversation_id?: string;
  created_at: string;
  is_edited: boolean;
  edited_at?: string;
  attachments?: MessageAttachment[];
  mentions?: string[];
  reply_to?: string;
  reactions?: Record<string, string[]>;
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  url: string;
  [key: string]: any; // Index signature for Json compatibility
}

export interface MessageWithAuthor extends Message {
  author: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  reply_message?: MessageWithAuthor;
  thread_replies?: MessageWithAuthor[];
}

export const editMessage = async (messageId: string, newContent: string): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .update({
      content: newContent,
      is_edited: true,
      edited_at: new Date().toISOString()
    })
    .eq('id', messageId);

  if (error) {
    throw new Error(`Failed to edit message: ${error.message}`);
  }
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    throw new Error(`Failed to delete message: ${error.message}`);
  }
};

export const addReaction = async (messageId: string, emoji: string, userId: string): Promise<void> => {
  const { data: message } = await supabase
    .from('messages')
    .select('reactions')
    .eq('id', messageId)
    .single();

  const reactions = (message?.reactions as Record<string, string[]>) || {};
  
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

  if (error) {
    throw new Error(`Failed to add reaction: ${error.message}`);
  }
};

export const pinMessage = async (
  messageId: string,
  channelId?: string,
  dmConversationId?: string
): Promise<void> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('pinned_messages')
    .insert({
      message_id: messageId,
      channel_id: channelId,
      dm_conversation_id: dmConversationId,
      pinned_by: user.user.id
    });

  if (error) {
    throw new Error(`Failed to pin message: ${error.message}`);
  }
};

export const getMessages = async (
  channelId?: string, 
  conversationId?: string,
  limit = 50
): Promise<MessageWithAuthor[]> => {
  let query = supabase
    .from('messages')
    .select(`
      id,
      content,
      user_id,
      channel_id,
      dm_conversation_id,
      created_at,
      is_edited,
      edited_at,
      attachments,
      mentions,
      reply_to,
      reactions,
      profiles:user_id (
        display_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (channelId) {
    query = query.eq('channel_id', channelId);
  } else if (conversationId) {
    query = query.eq('dm_conversation_id', conversationId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  return (data || []).map(msg => ({
    ...msg,
    attachments: Array.isArray(msg.attachments) ? (msg.attachments as unknown as MessageAttachment[]) : [],
    author: {
      id: msg.user_id,
      display_name: (msg.profiles as any)?.display_name || `User ${msg.user_id.slice(0, 8)}`,
      avatar_url: (msg.profiles as any)?.avatar_url
    }
  })) as MessageWithAuthor[];
};

export const sendMessage = async (
  content: string,
  channelId?: string,
  conversationId?: string,
  attachments?: MessageAttachment[],
  replyTo?: string
): Promise<Message> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const messageData = {
    content,
    user_id: user.user.id,
    channel_id: channelId,
    dm_conversation_id: conversationId,
    attachments: attachments as any || [],
    reply_to: replyTo,
    mentions: extractMentions(content),
  };

  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }

  return {
    ...data,
    attachments: Array.isArray(data.attachments) ? (data.attachments as unknown as MessageAttachment[]) : []
  } as Message;
};

// Helper function to extract mentions from message content
const extractMentions = (content: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
};
