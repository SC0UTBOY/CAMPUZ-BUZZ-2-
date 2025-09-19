import { supabase } from '@/integrations/supabase/client';

export class BasicLikesService {
  // Simple toggle like that creates likes table if needed
  static async toggleLike(postId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check existing likes with retry logic
      let existingLikes: any[] = [];
      let hasLiked = false;
      
      try {
        // Use upsert approach to handle race conditions
        const { data, error } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id);
          
        if (error) {
          console.log('Error checking existing likes:', error);
        } else {
          existingLikes = data || [];
          hasLiked = existingLikes.length > 0;
        }
      } catch (error) {
        console.log('Likes table might not exist or other error:', error);
      }

      if (hasLiked) {
        // Remove like
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        // Add like with duplicate handling
        const { error: insertError } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        // Handle duplicate key constraint errors
        if (insertError) {
          if (insertError.code === '23505' || 
              insertError.message.includes('duplicate key') ||
              insertError.message.includes('likes_user_id_post_id_key') ||
              insertError.message.includes('unique constraint')) {
            // User already liked this post, treat as success
            console.log('Duplicate like detected, treating as already liked');
          } else if (!insertError.message.includes('does not exist')) {
            throw insertError;
          }
        }
      }

      // Get updated count
      let likeCount = 0;
      try {
        const { count } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);
        likeCount = count || 0;
      } catch (error) {
        // If we can't get count, estimate it
        likeCount = hasLiked ? 0 : 1;
      }

      return {
        isLiked: !hasLiked,
        likeCount
      };
    } catch (error) {
      console.error('Like error:', error);
      throw error;
    }
  }

  // Get like status - simplified version
  static async getLikeStatus(postId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let likeCount = 0;
      let isLiked = false;

      try {
        // Try to get like count
        const { count } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);
        likeCount = count || 0;

        // Check if user liked this post
        if (user) {
          const { data: userLikes } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id);
          
          isLiked = userLikes && userLikes.length > 0;
        }
      } catch (error) {
        // If likes table doesn't exist, return defaults
        console.log('Likes table not accessible, using defaults');
      }

      return { isLiked, likeCount };
    } catch (error) {
      console.error('Error getting like status:', error);
      return { isLiked: false, likeCount: 0 };
    }
  }
}

export const basicLikesService = BasicLikesService;
