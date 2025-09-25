import { supabase } from '@/integrations/supabase/client';

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface CommentLikeWithProfile {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
  profiles: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export class CommentLikesService {
  // Like a comment
  static async likeComment(commentId: string): Promise<CommentLike> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error liking comment:', error);
      throw error;
    }
  }

  // Unlike a comment
  static async unlikeComment(commentId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error unliking comment:', error);
      throw error;
    }
  }

  // Toggle like status (like if not liked, unlike if liked)
  static async toggleLike(commentId: string): Promise<{ liked: boolean; likeCount: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if already liked
      const { data: existingLike, error: checkError } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingLike) {
        // Unlike
        await this.unlikeComment(commentId);
        const likeCount = await this.getLikeCount(commentId);
        return { liked: false, likeCount };
      } else {
        // Like
        await this.likeComment(commentId);
        const likeCount = await this.getLikeCount(commentId);
        return { liked: true, likeCount };
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  // Check if current user liked a comment
  static async isLikedByUser(commentId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking like status:', error);
      return false;
    }
  }

  // Get like count for a comment
  static async getLikeCount(commentId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('comment_likes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting like count:', error);
      return 0;
    }
  }

  // Get all likes for a comment with user profiles
  static async getCommentLikes(commentId: string): Promise<CommentLikeWithProfile[]> {
    try {
      const { data, error } = await supabase
        .from('comment_likes')
        .select(`
          *,
          profiles!inner (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('comment_id', commentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(like => ({
        ...like,
        profiles: Array.isArray(like.profiles) ? like.profiles[0] : like.profiles
      }));
    } catch (error) {
      console.error('Error getting comment likes:', error);
      return [];
    }
  }

  // Get like status and count for multiple comments
  static async getLikesForComments(commentIds: string[]): Promise<Record<string, { liked: boolean; likeCount: number }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Return all false if not authenticated
        return commentIds.reduce((acc, id) => ({ ...acc, [id]: { liked: false, likeCount: 0 } }), {});
      }

      // Get like counts for all comments
      const { data: counts, error: countsError } = await supabase
        .from('comments')
        .select('id, likes_count')
        .in('id', commentIds);

      if (countsError) throw countsError;

      // Get user's likes for all comments
      const { data: userLikes, error: likesError } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', commentIds);

      if (likesError) throw likesError;

      const likedCommentIds = new Set(userLikes?.map(like => like.comment_id) || []);
      const countMap = new Map(counts?.map(c => [c.id, c.likes_count]) || []);

      return commentIds.reduce((acc, id) => ({
        ...acc,
        [id]: {
          liked: likedCommentIds.has(id),
          likeCount: countMap.get(id) || 0
        }
      }), {});
    } catch (error) {
      console.error('Error getting likes for comments:', error);
      return commentIds.reduce((acc, id) => ({ ...acc, [id]: { liked: false, likeCount: 0 } }), {});
    }
  }
}









