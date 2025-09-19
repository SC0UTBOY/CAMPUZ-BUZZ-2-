import { supabase } from '@/integrations/supabase/client';
import { PostComments } from '@/services/posts/postComments';
import { CommentLikesService } from './commentLikesService';
import { CommentRepliesService } from './commentRepliesService';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  depth: number;
  likes_count: number;
  reply_count: number;
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
  isLiked?: boolean;
  commentReplies?: CommentReplyWithProfile[];
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

export interface CreateCommentData {
  post_id: string;
  content: string;
  parent_id?: string;
}

export class CommentsService {
  // Get comments for a specific post with threading - SUPABASE FUNCTION VERSION
  static async getPostComments(postId: string, limit: number = 20): Promise<Comment[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('User not authenticated');

      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('get-comments', {
        body: { postId, limit },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch comments');
      }

      // Ensure reply_count is present in the returned data
      return (data as any[]).map(comment => ({
        ...comment,
        reply_count: comment.reply_count || 0,
        likes_count: comment.likes_count || 0,
        reactions: comment.reactions || {},
        profiles: comment.profiles ? {
          id: comment.profiles.id,
          display_name: comment.profiles.display_name,
          avatar_url: comment.profiles.avatar_url,
          major: comment.profiles.major,
          year: comment.profiles.year
        } : {
          id: '',
          display_name: 'Unknown User',
          avatar_url: undefined,
          major: undefined,
          year: undefined
        }
      })) as Comment[];
    } catch (error) {
      console.error('Error fetching post comments:', error);
      throw error;
    }
  }

  // Get recent comments for feed preview (top-level only) - FIXED VERSION
  static async getRecentComments(postId: string, limit: number = 3): Promise<Comment[]> {
    try {
      // First, get comments
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .is('parent_id', null) // Only top-level comments for feed
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
        reactions: (comment.reactions as Record<string, any>) || {},
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

  // Create a new comment or reply - SUPABASE FUNCTION VERSION
  static async createComment(commentData: CreateCommentData): Promise<Comment> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('User not authenticated');

      // Log for debugging
      console.log('Invoking create-comment Edge Function with data:', {
        postId: commentData.post_id,
        content: commentData.content,
        parent_id: commentData.parent_id
      });

      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('create-comment', {
        body: {
          postId: commentData.post_id,
          content: commentData.content,
          parent_id: commentData.parent_id
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Supabase function error details:', {
          message: error.message,
          context: error.context,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(error.message || 'Failed to create comment');
      }

      const comment: Comment = data;

      // Note: Notifications and mentions are handled in the edge function
      // No need to call PostComments.addComment as the comment is already created

      return comment;
    } catch (error: any) {
      console.error('Error creating comment:', error);
      if (error.context) {
        console.error('Supabase error context:', error.context);
      }
      throw new Error(`Failed to post comment: ${error.message}`);
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

  // Update a comment (user's own only) - FIXED VERSION
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
        .maybeSingle();

      if (commentError) throw commentError;

      // Get the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // Don't throw error if profile not found, just use fallback
      if (profileError) {
        console.warn('Profile not found for user:', user.id, profileError);
      }

      // Return comment with profile
      return {
        ...comment,
        reactions: (comment.reactions as Record<string, any>) || {},
        profiles: profile ? {
          id: profile.id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          major: profile.major,
          year: profile.year
        } : {
          id: user.id,
          display_name: 'Unknown User',
          avatar_url: undefined,
          major: undefined,
          year: undefined
        }
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

  // Get comments with likes and replies data
  static async getCommentsWithLikesAndReplies(postId: string, limit: number = 20): Promise<Comment[]> {
    try {
      // Get comments with basic data
      const comments = await this.getPostComments(postId, limit);
      
      if (comments.length === 0) {
        return [];
      }

      const commentIds = comments.map(c => c.id);

      // Get like data for all comments
      const likesData = await CommentLikesService.getLikesForComments(commentIds);

      // Get reply counts for all comments
      const replyCounts = await CommentRepliesService.getReplyCounts(commentIds);

      // Get replies for all comments (limit to 3 per comment for performance)
      const repliesPromises = commentIds.map(commentId => 
        CommentRepliesService.getCommentReplies(commentId).then(replies => 
          replies.slice(0, 3) // Limit to 3 replies per comment
        )
      );
      const allReplies = await Promise.all(repliesPromises);

      // Combine all data
      const commentsWithLikesAndReplies = comments.map((comment, index) => ({
        ...comment,
        isLiked: likesData[comment.id]?.liked || false,
        likes_count: likesData[comment.id]?.likeCount || comment.likes_count,
        reply_count: replyCounts[comment.id] || comment.reply_count,
        commentReplies: allReplies[index] || []
      }));

      return commentsWithLikesAndReplies;
    } catch (error) {
      console.error('Error getting comments with likes and replies:', error);
      throw error;
    }
  }

  // Toggle like for a comment
  static async toggleCommentLike(commentId: string): Promise<{ liked: boolean; likeCount: number }> {
    try {
      return await CommentLikesService.toggleLike(commentId);
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error;
    }
  }

  // Create a reply to a comment
  static async createCommentReply(commentId: string, text: string): Promise<CommentReplyWithProfile> {
    try {
      return await CommentRepliesService.createReply({ comment_id: commentId, text });
    } catch (error) {
      console.error('Error creating comment reply:', error);
      throw error;
    }
  }

  // Get all replies for a comment
  static async getCommentReplies(commentId: string): Promise<CommentReplyWithProfile[]> {
    try {
      return await CommentRepliesService.getCommentReplies(commentId);
    } catch (error) {
      console.error('Error getting comment replies:', error);
      return [];
    }
  }
}