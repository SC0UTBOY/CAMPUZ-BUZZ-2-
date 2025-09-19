import { supabase } from '@/integrations/supabase/client';

export class SimpleLikesService {
  // Toggle like for a post
  static async toggleLike(postId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user already liked this post
      const { data: existingLikes, error: checkError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (checkError) {
        throw checkError;
      }

      const existingLike = existingLikes && existingLikes.length > 0 ? existingLikes[0] : null;

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

        if (insertError) {
          // If it's a duplicate key error, the user already liked it
          if (insertError.code === '23505' || insertError.message.includes('duplicate key')) {
            // User already liked this post, treat as already liked
            isLiked = true;
          } else {
            throw insertError;
          }
        } else {
          isLiked = true;
        }
      }

      // Get updated like count
      const { count: likeCount, error: countError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (countError) throw countError;

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
        const { data: userLikes, error: likeError } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (likeError) {
          console.warn('Error checking user like status:', likeError);
          // Don't throw, just assume not liked
        } else {
          isLiked = userLikes && userLikes.length > 0;
        }
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
}

export const simpleLikesService = SimpleLikesService;
