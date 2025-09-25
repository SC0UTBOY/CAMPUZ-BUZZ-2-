import { supabase } from '@/integrations/supabase/client';
import type { 
  Comment, 
  CommentInsert, 
  CommentUpdate, 
  CommentWithProfile 
} from '@/types/database';

export class NewCommentsService {
  // Create a new comment
  static async createComment(commentData: CommentInsert): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert(commentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get comments for a post with nested replies
  static async getPostComments(
    postId: string,
    limit = 50,
    offset = 0
  ): Promise<CommentWithProfile[]> {
    // Get top-level comments
    const { data: topLevelComments, error: topError } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url,
          username
        )
      `)
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (topError) throw topError;

    if (!topLevelComments || topLevelComments.length === 0) {
      return [];
    }

    // Get all replies for these comments
    const commentIds = topLevelComments.map(c => c.id);
    const { data: replies, error: repliesError } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url,
          username
        )
      `)
      .in('parent_id', commentIds)
      .order('created_at', { ascending: true });

    if (repliesError) throw repliesError;

    // Organize replies under their parent comments
    const commentsWithReplies = topLevelComments.map(comment => ({
      ...comment,
      replies: replies?.filter(reply => reply.parent_id === comment.id) || []
    }));

    return commentsWithReplies;
  }

  // Get a single comment with its replies
  static async getCommentById(commentId: string): Promise<CommentWithProfile | null> {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url,
          username
        )
      `)
      .eq('id', commentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    // Get replies if this is a top-level comment
    if (!data.parent_id) {
      const { data: replies } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url,
            username
          )
        `)
        .eq('parent_id', commentId)
        .order('created_at', { ascending: true });

      return {
        ...data,
        replies: replies || []
      };
    }

    return data;
  }

  // Update a comment
  static async updateComment(commentId: string, updates: CommentUpdate): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .update(updates)
      .eq('id', commentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete a comment
  static async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
  }

  // Like/unlike a comment
  static async toggleCommentLike(commentId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if user already liked this comment
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // Unlike the comment
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
    } else {
      // Like the comment
      const { error } = await supabase
        .from('likes')
        .insert({
          comment_id: commentId,
          user_id: user.id
        });

      if (error) throw error;
    }

    // Get updated like count
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId);

    return {
      isLiked: !existingLike,
      likeCount: count || 0
    };
  }

  // Get user's comments
  static async getUserComments(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<CommentWithProfile[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url,
          username
        ),
        posts (
          id,
          title,
          content
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  // Get recent comments across all posts
  static async getRecentComments(
    limit = 20,
    offset = 0
  ): Promise<CommentWithProfile[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url,
          username
        ),
        posts (
          id,
          title,
          visibility
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Filter out comments from private posts
    return data?.filter(comment => 
      comment.posts && comment.posts.visibility === 'public'
    ) || [];
  }

  // Create a reply to a comment
  static async createReply(
    parentCommentId: string,
    content: string,
    postId: string
  ): Promise<Comment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get parent comment to determine depth
    const { data: parentComment } = await supabase
      .from('comments')
      .select('depth')
      .eq('id', parentCommentId)
      .single();

    const depth = parentComment ? parentComment.depth + 1 : 1;

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
        parent_id: parentCommentId,
        depth: Math.min(depth, 3) // Limit nesting to 3 levels
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get comment thread (parent and all its replies)
  static async getCommentThread(commentId: string): Promise<CommentWithProfile[]> {
    // First, find the root comment
    const { data: comment } = await supabase
      .from('comments')
      .select('id, parent_id')
      .eq('id', commentId)
      .single();

    if (!comment) throw new Error('Comment not found');

    // Find the root comment ID
    let rootCommentId = comment.id;
    if (comment.parent_id) {
      const { data: rootComment } = await supabase
        .from('comments')
        .select('id')
        .eq('id', comment.parent_id)
        .is('parent_id', null)
        .single();
      
      if (rootComment) {
        rootCommentId = rootComment.id;
      }
    }

    // Get the entire thread
    const { data: thread, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url,
          username
        )
      `)
      .or(`id.eq.${rootCommentId},parent_id.eq.${rootCommentId}`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Organize the thread
    const rootComment = thread?.find(c => c.id === rootCommentId);
    const replies = thread?.filter(c => c.parent_id === rootCommentId) || [];

    if (!rootComment) return [];

    return [
      {
        ...rootComment,
        replies
      }
    ];
  }

  // Report a comment
  static async reportComment(
    commentId: string,
    reason: string,
    description?: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Note: You'll need to create a comment_reports table similar to post_reports
    // For now, we can use a generic reports table or extend the existing one
    
    const { error } = await supabase
      .from('user_reports') // Using user_reports as a generic reporting mechanism
      .insert({
        reported_user_id: commentId, // This would need to be adjusted for comment reports
        reported_by: user.id,
        reason,
        description,
        category: 'comment'
      });

    if (error) throw error;
  }

  // Get comment statistics for a user
  static async getUserCommentStats(userId: string): Promise<{
    totalComments: number;
    totalLikes: number;
    recentActivity: CommentWithProfile[];
  }> {
    const [commentsCount, likesCount, recentComments] = await Promise.all([
      // Total comments count
      supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      
      // Total likes on user's comments
      supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .in('comment_id', 
          supabase
            .from('comments')
            .select('id')
            .eq('user_id', userId)
        ),
      
      // Recent comments
      this.getUserComments(userId, 5, 0)
    ]);

    return {
      totalComments: commentsCount.count || 0,
      totalLikes: likesCount.count || 0,
      recentActivity: recentComments
    };
  }
}

export const newCommentsService = NewCommentsService;
