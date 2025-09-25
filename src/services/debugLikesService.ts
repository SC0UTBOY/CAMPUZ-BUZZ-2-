import { supabase } from '@/integrations/supabase/client';

export class DebugLikesService {
  // Debug function to check likes table structure
  static async debugLikesTable(): Promise<void> {
    try {
      console.log('🔍 Debugging likes table...');
      
      // Check if likes table exists and get some data
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('*')
        .limit(5);
      
      console.log('📊 Likes table data:', { likesData, likesError });
      
      // Check posts table for likes_count column
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, likes_count, is_liked')
        .limit(3);
      
      console.log('📊 Posts table data:', { postsData, postsError });
      
      // Check current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('👤 Current user:', { user: user?.id, userError });
      
    } catch (error) {
      console.error('❌ Debug error:', error);
    }
  }

  // Toggle like for a post with extensive logging
  static async toggleLike(postId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    try {
      console.log('❤️ Starting toggleLike for postId:', postId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated');
        throw new Error('User not authenticated');
      }
      
      console.log('👤 User authenticated:', user.id);

      // Check if user already liked this post
      console.log('🔍 Checking existing likes...');
      const { data: existingLikes, error: checkError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id);

      console.log('📊 Existing likes check:', { existingLikes, checkError });

      if (checkError) {
        console.error('❌ Error checking existing likes:', checkError);
        throw checkError;
      }

      const existingLike = existingLikes && existingLikes.length > 0 ? existingLikes[0] : null;
      console.log('💡 Existing like found:', !!existingLike);

      let isLiked: boolean;

      if (existingLike) {
        // Unlike: Remove the like
        console.log('👎 Removing like...');
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        console.log('🗑️ Delete result:', { deleteError });

        if (deleteError) {
          console.error('❌ Delete error:', deleteError);
          throw deleteError;
        }
        isLiked = false;
      } else {
        // Like: Add the like
        console.log('👍 Adding like...');
        const { error: insertError } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        console.log('➕ Insert result:', { insertError });

        if (insertError) {
          console.error('❌ Insert error:', insertError);
          // If it's a duplicate key error, the user already liked it
          if (insertError.code === '23505' || insertError.message.includes('duplicate key')) {
            console.log('⚠️ Duplicate key detected, treating as already liked');
            isLiked = true;
          } else {
            throw insertError;
          }
        } else {
          isLiked = true;
        }
      }

      // Get updated like count
      console.log('🔢 Getting like count...');
      const { count: likeCount, error: countError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      console.log('📊 Like count result:', { likeCount, countError });

      if (countError) {
        console.error('❌ Count error:', countError);
        throw countError;
      }

      const result = {
        isLiked,
        likeCount: likeCount || 0
      };

      console.log('✅ Toggle like result:', result);
      return result;
    } catch (error) {
      console.error('❌ Toggle like error:', error);
      throw error;
    }
  }

  // Get like status for a post with logging
  static async getLikeStatus(postId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    try {
      console.log('📊 Getting like status for postId:', postId);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get like count
      const { count: likeCount, error: countError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      console.log('🔢 Like count:', { likeCount, countError });

      if (countError) throw countError;

      let isLiked = false;

      if (user) {
        // Check if current user liked this post
        const { data: userLikes, error: likeError } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id);

        console.log('👤 User like check:', { userLikes, likeError });

        if (likeError) {
          console.warn('⚠️ Error checking user like status:', likeError);
        } else {
          isLiked = userLikes && userLikes.length > 0;
        }
      }

      const result = { isLiked, likeCount: likeCount || 0 };
      console.log('📊 Like status result:', result);
      return result;
    } catch (error) {
      console.error('❌ Get like status error:', error);
      return { isLiked: false, likeCount: 0 };
    }
  }
}

export const debugLikesService = DebugLikesService;
