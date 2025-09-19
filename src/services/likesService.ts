import { supabase } from '@/integrations/supabase/client';

export interface LikeResult {
  isLiked: boolean;
  likeCount: number;
}

export class LikesService {
  // Toggle like/unlike for a post
  static async toggleLike(postId: string): Promise<LikeResult> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if user already liked this post
      const { data: existingLike, error: selectError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (selectError) {
        console.error('Error checking existing like:', selectError);
        throw new Error('Failed to check like status');
      }

      let isLiked: boolean;

      if (existingLike) {
        // Unlike the post - DELETE
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (deleteError) {
          console.error('Error deleting like:', deleteError);
          throw new Error('Failed to unlike post');
        }
        isLiked = false;
      } else {
        // Like the post - INSERT
        const { error: insertError } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (insertError) {
          console.error('Error inserting like:', insertError);
          // Handle duplicate key error gracefully
          if (insertError.code === '23505') {
            // Duplicate - user already liked this post
            isLiked = true;
          } else {
            throw new Error('Failed to like post');
          }
        } else {
          isLiked = true;
        }
      }

      // Get updated like count from posts table (updated by trigger)
      const { data: postData, error: countError } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      if (countError) {
        console.error('Error getting like count:', countError);
        // Fallback: count manually
        const { count } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);
        
        return { isLiked, likeCount: count || 0 };
      }

      return {
        isLiked,
        likeCount: postData.likes_count || 0
      };
    } catch (error) {
      console.error('Toggle like error:', error);
      throw error;
    }
  }

  // Check if user has liked a post
  static async checkUserLike(postId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking user like:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Check user like error:', error);
      return false;
    }
  }

  // Get like count for a post
  static async getLikeCount(postId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      if (error) {
        console.error('Error getting like count:', error);
        return 0;
      }

      return data.likes_count || 0;
    } catch (error) {
      console.error('Get like count error:', error);
      return 0;
    }
  }

  // Get posts with user's like status
  static async getPostsWithLikeStatus(limit = 20, offset = 0): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = `
        *,
        profiles:user_id (
          display_name,
          avatar_url,
          username
        )
      `;

      // Add user like status if authenticated
      if (user) {
        query += `,
        user_likes:likes!inner(user_id)
        `;
      }

      const { data: posts, error } = await supabase
        .from('posts')
        .select(query)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching posts:', error);
        return [];
      }

      // Add is_liked property to each post
      return posts?.map(post => ({
        ...post,
        is_liked: user ? post.user_likes?.some((like: any) => like.user_id === user.id) : false
      })) || [];
    } catch (error) {
      console.error('Get posts with like status error:', error);
      return [];
    }
  }
}

export const likesService = LikesService;
