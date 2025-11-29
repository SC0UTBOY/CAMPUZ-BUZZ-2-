
import { supabase } from '@/integrations/supabase/client';
import { PostComments } from '@/services/posts/postComments';

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
    display_name: string;
    avatar_url?: string;
    major?: string;
    year?: string;
  };
  replies?: Comment[];
  reply_count?: number;
}

export interface CreateCommentData {
  post_id: string;
  content: string;
  parent_id?: string;
}

export class CommentsService {
  // Get comments for a specific post with threading
  static async getPostComments(postId: string, limit: number = 20): Promise<Comment[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          post_id,
          user_id,
          content,
          parent_id,
          depth,
          likes_count,
          created_at,
          updated_at,
          reactions,
          profiles:user_id (
            id,
            display_name,
            avatar_url,
            major,
            year
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      // Transform flat comments into threaded structure with proper typing
      return this.buildCommentTree((data || []).map(comment => ({
        ...comment,
        reactions: (comment.reactions as Record<string, any>) || {},
        profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles
      })));
    } catch (error) {
      console.error('Error fetching post comments:', error);
      throw error;
    }
  }

  // Get recent comments for feed preview (top-level only)
  static async getRecentComments(postId: string, limit: number = 3): Promise<Comment[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          post_id,
          user_id,
          content,
          parent_id,
          depth,
          likes_count,
          created_at,
          updated_at,
          reactions,
          profiles:user_id (
            id,
            display_name,
            avatar_url,
            major,
            year
          )
        `)
        .eq('post_id', postId)
        .is('parent_id', null) // Only top-level comments for feed
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(comment => ({
        ...comment,
        reactions: (comment.reactions as Record<string, any>) || {},
        profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles
      }));
    } catch (error) {
      console.error('Error fetching recent comments:', error);
      return [];
    }
  }

  // Create a new comment or reply
  static async createComment(commentData: CreateCommentData): Promise<Comment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate depth for threading (max 3 levels)
      let depth = 0;
      if (commentData.parent_id) {
        const { data: parentComment } = await supabase
          .from('comments')
          .select('depth')
          .eq('id', commentData.parent_id)
          .single();
        
        depth = Math.min((parentComment?.depth || 0) + 1, 3);
      }

      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          post_id: commentData.post_id,
          user_id: user.id,
          content: commentData.content.trim(),
          parent_id: commentData.parent_id || null,
          depth: depth
        })
        .select(`
          id,
          post_id,
          user_id,
          content,
          parent_id,
          depth,
          likes_count,
          created_at,
          updated_at,
          reactions,
          profiles:user_id (
            id,
            display_name,
            avatar_url,
            major,
            year
          )
        `)
        .single();

      if (error) throw error;

      // Send notifications and handle mentions
      await PostComments.addComment(
        commentData.post_id, 
        commentData.content, 
        commentData.parent_id
      );

      return {
        ...comment,
        reactions: (comment.reactions as Record<string, any>) || {},
        profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  // Delete a comment (user's own only)
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

  // Update a comment (user's own only)
  static async updateComment(commentId: string, content: string): Promise<Comment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: comment, error } = await supabase
        .from('comments')
        .update({ content: content.trim() })
        .eq('id', commentId)
        .eq('user_id', user.id)
        .select(`
          id,
          post_id,
          user_id,
          content,
          parent_id,
          depth,
          likes_count,
          created_at,
          updated_at,
          reactions,
          profiles:user_id (
            id,
            display_name,
            avatar_url,
            major,
            year
          )
        `)
        .single();

      if (error) throw error;

      return {
        ...comment,
        reactions: (comment.reactions as Record<string, any>) || {},
        profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles
      };
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  // Build threaded comment tree from flat array
  private static buildCommentTree(comments: any[]): Comment[] {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create comment objects
    comments.forEach(comment => {
      const processedComment: Comment = {
        ...comment,
        profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles,
        replies: [],
        reply_count: 0
      };
      commentMap.set(comment.id, processedComment);
    });

    // Second pass: build tree structure
    comments.forEach(comment => {
      const processedComment = commentMap.get(comment.id)!;
      
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(processedComment);
          parent.reply_count = (parent.reply_count || 0) + 1;
        }
      } else {
        rootComments.push(processedComment);
      }
    });

    // Sort replies by creation time
    const sortReplies = (comment: Comment) => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        comment.replies.forEach(sortReplies);
      }
    };

    rootComments.forEach(sortReplies);
    return rootComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
