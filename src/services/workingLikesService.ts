import { supabase } from '@/integrations/supabase/client';

export class WorkingLikesService {
  // Simple toggle like that works with any database structure
  static async toggleLike(postId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First, try to create the likes table if it doesn't exist
      await this.ensureLikesTable();

      // Check if user already liked this post
      const { data: existingLikes } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id);

      const hasLiked = existingLikes && existingLikes.length > 0;

      if (hasLiked) {
        // Remove like
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        // Add like - use upsert to handle duplicates
        await supabase
          .from('likes')
          .upsert({
            post_id: postId,
            user_id: user.id,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'post_id,user_id'
          });
      }

      // Get updated count
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      return {
        isLiked: !hasLiked,
        likeCount: count || 0
      };
    } catch (error) {
      console.error('Like error:', error);
      // If likes table doesn't exist, try to work with posts table directly
      return await this.fallbackToggleLike(postId);
    }
  }

  // Fallback method that works with just the posts table
  static async fallbackToggleLike(postId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get current post data
      const { data: post } = await supabase
        .from('posts')
        .select('likes_count, liked_by_users')
        .eq('id', postId)
        .single();

      if (!post) throw new Error('Post not found');

      const likedByUsers = post.liked_by_users || [];
      const currentLikeCount = post.likes_count || 0;
      const hasLiked = likedByUsers.includes(user.id);

      let newLikedByUsers;
      let newLikeCount;

      if (hasLiked) {
        // Remove user from liked_by_users array
        newLikedByUsers = likedByUsers.filter((id: string) => id !== user.id);
        newLikeCount = Math.max(currentLikeCount - 1, 0);
      } else {
        // Add user to liked_by_users array
        newLikedByUsers = [...likedByUsers, user.id];
        newLikeCount = currentLikeCount + 1;
      }

      // Update post
      await supabase
        .from('posts')
        .update({
          likes_count: newLikeCount,
          liked_by_users: newLikedByUsers
        })
        .eq('id', postId);

      return {
        isLiked: !hasLiked,
        likeCount: newLikeCount
      };
    } catch (error) {
      console.error('Fallback like error:', error);
      throw error;
    }
  }

  // Ensure likes table exists
  static async ensureLikesTable(): Promise<void> {
    try {
      // Try to create likes table
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.likes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            post_id UUID NOT NULL,
            user_id UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE(post_id, user_id)
          );
          
          ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY IF NOT EXISTS "Users can view all likes" ON public.likes
            FOR SELECT USING (true);
          
          CREATE POLICY IF NOT EXISTS "Users can manage their own likes" ON public.likes
            FOR ALL USING (auth.uid() = user_id);
        `
      });

      if (error) {
        console.warn('Could not create likes table:', error);
      }
    } catch (error) {
      console.warn('Table creation failed:', error);
    }
  }

  // Get like status for a post
  static async getLikeStatus(postId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Try likes table first
      try {
        const { count } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        let isLiked = false;
        if (user) {
          const { data: userLikes } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id);
          
          isLiked = userLikes && userLikes.length > 0;
        }

        return { isLiked, likeCount: count || 0 };
      } catch (likesError) {
        // Fallback to posts table
        const { data: post } = await supabase
          .from('posts')
          .select('likes_count, liked_by_users')
          .eq('id', postId)
          .single();

        if (!post) return { isLiked: false, likeCount: 0 };

        const likedByUsers = post.liked_by_users || [];
        const isLiked = user ? likedByUsers.includes(user.id) : false;

        return {
          isLiked,
          likeCount: post.likes_count || 0
        };
      }
    } catch (error) {
      console.error('Error getting like status:', error);
      return { isLiked: false, likeCount: 0 };
    }
  }
}

export const workingLikesService = WorkingLikesService;
