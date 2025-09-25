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

export class FixedCommentsService {
  // Get comments for a post
  static async getPostComments(postId: string, limit: number = 20): Promise<Comment[]> {
    try {
      const { data: comments, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey(
            user_id,
            display_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (comments || []).map(comment => ({
        ...comment,
        profiles: {
          id: (comment as any).profiles.id,
          display_name: (comment as any).profiles.display_name,
          avatar_url: (comment as any).profiles.avatar_url
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
      const { data: comments, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey(
            user_id,
            display_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .is('parent_id', null) // Only top-level comments for feed
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (comments || []).map(comment => ({
        ...comment,
        profiles: {
          id: (comment as any).profiles.id,
          display_name: (comment as any).profiles.display_name,
          avatar_url: (comment as any).profiles.avatar_url
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
        .select(`
          *,
          profiles!inner(
            id,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (commentError) throw commentError;

      // Comment count will be updated automatically by database trigger

      return {
        ...comment,
        profiles: {
          id: (comment as any).profiles.id,
          display_name: (comment as any).profiles.display_name,
          avatar_url: (comment as any).profiles.avatar_url
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

      // Comment count will be updated automatically by database trigger
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
        .select(`
          *,
          profiles!inner(
            id,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return {
        ...comment,
        profiles: {
          id: (comment as any).profiles.id,
          display_name: (comment as any).profiles.display_name,
          avatar_url: (comment as any).profiles.avatar_url
        }
      } as Comment;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  // Get comment count for a post
  static async getCommentCount(postId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting comment count:', error);
      return 0;
    }
  }
}

// Export both the class and an instance for convenience
export const fixedCommentsService = FixedCommentsService;
