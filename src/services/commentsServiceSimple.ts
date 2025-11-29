import { supabase } from '@/integrations/supabase/client';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  depth: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
  reactions: Record<string, any>;
  profiles: {
    id: string;
    user_id: string;
    display_name: string;
    avatar_url?: string;
    major?: string;
    year?: string;
  };
}

export interface CreateCommentData {
  post_id: string;
  content: string;
  parent_id?: string;
}

export class CommentsServiceSimple {
  // Get comments for a specific post - SIMPLIFIED VERSION
  static async getPostComments(postId: string, limit: number = 20): Promise<Comment[]> {
    try {
      // First, get comments
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (commentsError) throw commentsError;

      if (!comments || comments.length === 0) {
        return [];
      }

      // Get user IDs from comments
      const userIds = [...new Set(comments.map(c => c.user_id))];

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

      // Combine comments with profiles
      const commentsWithProfiles = comments.map(comment => ({
        ...comment,
        reactions: comment.reactions || {},
        profiles: profileMap.get(comment.user_id) || {
          id: comment.user_id,
          user_id: comment.user_id,
          display_name: 'Unknown User',
          avatar_url: null,
          major: null,
          year: null
        }
      }));

      return commentsWithProfiles;
    } catch (error) {
      console.error('Error fetching post comments:', error);
      throw error;
    }
  }

  // Get recent comments - SIMPLIFIED VERSION
  static async getRecentComments(postId: string, limit: number = 3): Promise<Comment[]> {
    try {
      // First, get comments
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (commentsError) throw commentsError;

      if (!comments || comments.length === 0) {
        return [];
      }

      // Get user IDs from comments
      const userIds = [...new Set(comments.map(c => c.user_id))];

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

      // Combine comments with profiles
      const commentsWithProfiles = comments.map(comment => ({
        ...comment,
        reactions: comment.reactions || {},
        profiles: profileMap.get(comment.user_id) || {
          id: comment.user_id,
          user_id: comment.user_id,
          display_name: 'Unknown User',
          avatar_url: null,
          major: null,
          year: null
        }
      }));

      return commentsWithProfiles;
    } catch (error) {
      console.error('Error fetching recent comments:', error);
      return [];
    }
  }

  // Create a new comment - SIMPLIFIED VERSION
  static async createComment(commentData: CreateCommentData): Promise<Comment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create the comment
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .insert({
          post_id: commentData.post_id,
          user_id: user.id,
          content: commentData.content.trim(),
          parent_id: commentData.parent_id || null,
          depth: 0
        })
        .select()
        .single();

      if (commentError) throw commentError;

      // Get the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Return comment with profile
      return {
        ...comment,
        reactions: comment.reactions || {},
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
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  // Delete a comment
  static async deleteComment(commentId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  // Update a comment
  static async updateComment(commentId: string, content: string): Promise<Comment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .update({ content: content.trim() })
        .eq('id', commentId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (commentError) throw commentError;

      // Get the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Return comment with profile
      return {
        ...comment,
        reactions: comment.reactions || {},
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
      console.error('Error updating comment:', error);
      throw error;
    }
  }
}





















