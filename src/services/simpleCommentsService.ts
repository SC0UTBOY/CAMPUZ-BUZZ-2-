import { supabase } from '@/integrations/supabase/client';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  depth: number;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

export interface CreateCommentData {
  post_id: string;
  content: string;
  parent_id?: string;
}

export class SimpleCommentsService {
  // Get comments for a post with manual profile joining
  static async getPostComments(postId: string, limit: number = 20): Promise<Comment[]> {
    try {
      // First get the comments
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (commentsError) throw commentsError;
      if (!comments || comments.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(comments.map(c => c.user_id))];

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles' as any)
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) {
        console.warn('Could not fetch profiles:', profilesError);
        // Continue without profiles
      }

      // Combine comments with profiles
      return comments.map(comment => ({
        ...comment,
        profiles: {
          id: comment.user_id,
          display_name: profiles?.find((p: any) => p.id === comment.user_id)?.display_name || 'Unknown User',
          avatar_url: profiles?.find((p: any) => p.id === comment.user_id)?.avatar_url
        }
      })) as Comment[];
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  // Get recent comments for feed preview
  static async getRecentComments(postId: string, limit: number = 3): Promise<Comment[]> {
    try {
      // First get the comments
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .is('parent_id', null) // Only top-level comments for feed
        .order('created_at', { ascending: false })
        .limit(limit);

      if (commentsError) throw commentsError;
      if (!comments || comments.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(comments.map(c => c.user_id))];

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles' as any)
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) {
        console.warn('Could not fetch profiles:', profilesError);
        // Continue without profiles
      }

      // Combine comments with profiles
      return comments.map(comment => ({
        ...comment,
        profiles: {
          id: comment.user_id,
          display_name: profiles?.find((p: any) => p.id === comment.user_id)?.display_name || 'Unknown User',
          avatar_url: profiles?.find((p: any) => p.id === comment.user_id)?.avatar_url
        }
      })) as Comment[];
    } catch (error) {
      console.error('Error fetching recent comments:', error);
      return [];
    }
  }

  // Create a new comment
  static async createComment(commentData: CreateCommentData): Promise<Comment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate depth for nested comments
      let depth = 0;
      if (commentData.parent_id) {
        const { data: parentComment } = await supabase
          .from('comments')
          .select('depth')
          .eq('id', commentData.parent_id)
          .single();

        depth = Math.min((parentComment?.depth || 0) + 1, 3); // Max depth of 3
      }

      // Insert the comment
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .insert({
          post_id: commentData.post_id,
          content: commentData.content,
          parent_id: commentData.parent_id || null,
          user_id: user.id,
          depth
        })
        .select('*')
        .single();

      if (commentError) throw commentError;

      // Get the user's profile
      const { data: profile } = await supabase
        .from('user_profiles' as any)
        .select('id, display_name, avatar_url')
        .eq('id', user.id)
        .single();

      return {
        ...comment,
        profiles: {
          id: user.id,
          display_name: profile?.display_name || user.email?.split('@')[0] || 'Unknown User',
          avatar_url: profile?.avatar_url
        }
      } as Comment;
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

      // Get the comment to find the post_id
      const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('post_id, user_id')
        .eq('id', commentId)
        .single();

      if (fetchError) throw fetchError;
      if (comment.user_id !== user.id) {
        throw new Error('You can only delete your own comments');
      }

      // Delete the comment
      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
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

      const { data: comment, error } = await supabase
        .from('comments')
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (error) throw error;

      // Get the user's profile
      const { data: profile } = await supabase
        .from('user_profiles' as any)
        .select('id, display_name, avatar_url')
        .eq('id', user.id)
        .single();

      return {
        ...comment,
        profiles: {
          id: user.id,
          display_name: profile?.display_name || user.email?.split('@')[0] || 'Unknown User',
          avatar_url: profile?.avatar_url
        }
      } as Comment;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }
}

export const simpleCommentsService = SimpleCommentsService;
