import { supabase } from '@/integrations/supabase/client';

export interface CommentReply {
  id: string;
  comment_id: string;
  user_id: string;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface CommentReplyWithProfile {
  id: string;
  comment_id: string;
  user_id: string;
  text: string;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    display_name: string;
    avatar_url?: string;
    major?: string;
    year?: string;
  };
}

export interface CreateReplyData {
  comment_id: string;
  text: string;
}

export class CommentRepliesService {
  // Create a reply to a comment
  static async createReply(replyData: CreateReplyData): Promise<CommentReplyWithProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create the reply
      const { data: reply, error: replyError } = await supabase
        .from('replies')
        .insert({
          comment_id: replyData.comment_id,
          user_id: user.id,
          text: replyData.text.trim()
        })
        .select()
        .single();

      if (replyError) throw replyError;

      // Get the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.warn('Profile not found for user:', user.id, profileError);
      }

      // Return reply with profile
      return {
        ...reply,
        profiles: profile || {
          id: user.id,
          user_id: user.id,
          display_name: 'Unknown User',
          avatar_url: null,
          major: null,
          year: null
        }
      };
    } catch (error) {
      console.error('Error creating reply:', error);
      throw error;
    }
  }

  // Get all replies for a comment
  static async getCommentReplies(commentId: string): Promise<CommentReplyWithProfile[]> {
    try {
      // First, get replies
      const { data: replies, error: repliesError } = await supabase
        .from('replies')
        .select('*')
        .eq('comment_id', commentId)
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      if (!replies || replies.length === 0) {
        return [];
      }

      // Get user IDs from replies
      const userIds = [...new Set(replies.map(r => r.user_id))];

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user_id to profile
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      // Combine replies with profiles
      const repliesWithProfiles = replies.map(reply => ({
        ...reply,
        profiles: profileMap.get(reply.user_id) || {
          id: reply.user_id,
          user_id: reply.user_id,
          display_name: 'Unknown User',
          avatar_url: null,
          major: null,
          year: null
        }
      }));

      return repliesWithProfiles;
    } catch (error) {
      console.error('Error fetching comment replies:', error);
      return [];
    }
  }

  // Update a reply (user's own only)
  static async updateReply(replyId: string, text: string): Promise<CommentReplyWithProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: reply, error: replyError } = await supabase
        .from('replies')
        .update({ 
          text: text.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', replyId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (replyError) throw replyError;

      // Get the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.warn('Profile not found for user:', user.id, profileError);
      }

      // Return reply with profile
      return {
        ...reply,
        profiles: profile || {
          id: user.id,
          user_id: user.id,
          display_name: 'Unknown User',
          avatar_url: null,
          major: null,
          year: null
        }
      };
    } catch (error) {
      console.error('Error updating reply:', error);
      throw error;
    }
  }

  // Delete a reply (user's own only)
  static async deleteReply(replyId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('replies')
        .delete()
        .eq('id', replyId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting reply:', error);
      throw error;
    }
  }

  // Get reply count for a comment
  static async getReplyCount(commentId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('replies')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting reply count:', error);
      return 0;
    }
  }

  // Get reply counts for multiple comments
  static async getReplyCounts(commentIds: string[]): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('id, reply_count')
        .in('id', commentIds);

      if (error) throw error;

      const countMap = new Map(data?.map(c => [c.id, c.reply_count]) || []);
      return commentIds.reduce((acc, id) => ({
        ...acc,
        [id]: countMap.get(id) || 0
      }), {});
    } catch (error) {
      console.error('Error getting reply counts:', error);
      return commentIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {});
    }
  }
}





















