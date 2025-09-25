import { supabase } from '@/integrations/supabase/client';

export interface LikeData {
  post_id: string;
  user_id: string;
  created_at: string;
}

export class FixedLikesService {
  // Toggle like for a post
  static async toggleLike(postId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user already liked this post
      const { data: existingLike, error: checkError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      let isLiked: boolean;

      if (existingLike) {
        // Unlike: Remove the like
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
        isLiked = false;
      } else {
        // Like: Add the like
        const { error: insertError } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (insertError) throw insertError;
        isLiked = true;
      }

      // Get updated like count
      const { count: likeCount, error: countError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (countError) throw countError;

      // Like count will be updated automatically by database trigger

      return {
        isLiked,
        likeCount: likeCount || 0
      };
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  // Get like status for a post
  static async getLikeStatus(postId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get like count
      const { count: likeCount, error: countError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (countError) throw countError;

      let isLiked = false;

      if (user) {
        // Check if current user liked this post
        const { data: userLike, error: likeError } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .single();

        if (likeError && likeError.code !== 'PGRST116') {
          throw likeError;
        }

        isLiked = !!userLike;
      }

      return {
        isLiked,
        likeCount: likeCount || 0
      };
    } catch (error) {
      console.error('Error getting like status:', error);
      return { isLiked: false, likeCount: 0 };
    }
  }

  // Get likes for multiple posts (for feed optimization)
  static async getLikesForPosts(postIds: string[]): Promise<Record<string, { isLiked: boolean; likeCount: number }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (postIds.length === 0) return {};

      // Get all likes for these posts
      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('post_id, user_id')
        .in('post_id', postIds);

      if (likesError) throw likesError;

      // Process the data
      const result: Record<string, { isLiked: boolean; likeCount: number }> = {};

      // Initialize all posts
      postIds.forEach(postId => {
        result[postId] = { isLiked: false, likeCount: 0 };
      });

      // Count likes and check user's likes
      likes?.forEach(like => {
        if (!result[like.post_id]) {
          result[like.post_id] = { isLiked: false, likeCount: 0 };
        }
        
        result[like.post_id].likeCount++;
        
        if (user && like.user_id === user.id) {
          result[like.post_id].isLiked = true;
        }
      });

      return result;
    } catch (error) {
      console.error('Error getting likes for posts:', error);
      return {};
    }
  }
}

export const fixedLikesService = new FixedLikesService();
