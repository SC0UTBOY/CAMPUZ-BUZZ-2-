import { supabase } from '@/integrations/supabase/client';
import type { 
  Post, 
  PostInsert, 
  PostUpdate, 
  PostWithProfile, 
  PostWithDetails,
  Database 
} from '@/types/database';

export class NewPostsService {
  // Create a new post
  static async createPost(postData: PostInsert): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get posts with profile information
  static async getPosts(
    limit = 20, 
    offset = 0,
    communityId?: string
  ): Promise<PostWithProfile[]> {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url,
            username
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (communityId) {
        query = query.eq('community_id', communityId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching posts:', error);
        // Try fallback query without profiles if the join fails
        try {
          const fallbackQuery = supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
          
          const { data: fallbackData } = await fallbackQuery;
          return fallbackData || [];
        } catch {
          return [];
        }
      }
      
      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching posts:', error);
      return [];
    }
  }

  // Get user's personalized feed
  static async getUserFeed(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<Database['public']['Functions']['get_user_feed']['Returns']> {
    const { data, error } = await supabase.rpc('get_user_feed', {
      user_id_param: userId,
      limit_count: limit,
      offset_count: offset
    });

    if (error) throw error;
    return data || [];
  }

  // Get a single post with full details
  static async getPostById(postId: string): Promise<PostWithDetails | null> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url,
          username
        ),
        comments (
          *,
          profiles:user_id (
            display_name,
            avatar_url,
            username
          )
        )
      `)
      .eq('id', postId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  }

  // Update a post
  static async updatePost(postId: string, updates: PostUpdate): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete a post
  static async deletePost(postId: string): Promise<void> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  }

  // Like/unlike a post - DUPLICATE BUG FIXED
  static async toggleLike(postId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if user already liked this post
      const { data: existingLike, error: selectError } = await supabase
        .from('post_likes')
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
        // Unlike the post - DELETE existing like
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (deleteError) {
          console.error('Error deleting like:', deleteError);
          throw new Error('Failed to unlike post');
        }
        isLiked = false;
      } else {
        // Like the post - INSERT new like
        const { error: insertError } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (insertError) {
          console.error('Error inserting like:', insertError);
          // Handle duplicate key error (race condition)
          if (insertError.code === '23505') {
            // Duplicate constraint violation - user already liked this post
            console.log('Like already exists (race condition), treating as liked');
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
        console.error('Error getting like count from posts:', countError);
        // Fallback: count manually from post_likes table
        const { count } = await supabase
          .from('post_likes')
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

  // Save/unsave a post
  static async toggleSave(postId: string): Promise<{ isSaved: boolean }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if user already saved this post
    const { data: existingSave } = await supabase
      .from('post_saves')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existingSave) {
      // Unsave the post
      const { error } = await supabase
        .from('post_saves')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { isSaved: false };
    } else {
      // Save the post
      const { error } = await supabase
        .from('post_saves')
        .insert({
          post_id: postId,
          user_id: user.id
        });

      if (error) throw error;
      return { isSaved: true };
    }
  }

  // Get user's saved posts
  static async getSavedPosts(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<PostWithProfile[]> {
    const { data, error } = await supabase
      .from('post_saves')
      .select(`
        posts (
          *,
          profiles:user_id (
            display_name,
            avatar_url,
            username
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data?.map(item => item.posts).filter(Boolean) || [];
  }

  // Search posts
  static async searchPosts(
    query: string,
    limit = 20,
    offset = 0
  ): Promise<Database['public']['Functions']['search_all']['Returns']> {
    const { data, error } = await supabase.rpc('search_all', {
      search_query: query,
      search_type: 'posts',
      limit_count: limit,
      offset_count: offset
    });

    if (error) throw error;
    return data || [];
  }

  // Get trending posts
  static async getTrendingPosts(limit = 20): Promise<any[]> {
    const { data, error } = await supabase
      .from('popular_posts')
      .select('*')
      .order('popularity_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Get posts by hashtag
  static async getPostsByHashtag(
    hashtag: string,
    limit = 20,
    offset = 0
  ): Promise<PostWithProfile[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url,
          username
        )
      `)
      .contains('hashtags', [hashtag])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  // Get user's posts
  static async getUserPosts(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<PostWithProfile[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url,
          username
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  // Report a post
  static async reportPost(
    postId: string,
    reason: string,
    description?: string,
    category = 'other'
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('post_reports')
      .insert({
        post_id: postId,
        reported_by: user.id,
        reason,
        description,
        category
      });

    if (error) throw error;
  }

  // Get post analytics (for post owners)
  static async getPostAnalytics(postId: string): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Verify user owns the post
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (!post || post.user_id !== user.id) {
      throw new Error('Unauthorized');
    }

    // Get analytics data
    const [likesData, commentsData, sharesData] = await Promise.all([
      supabase
        .from('likes')
        .select('created_at')
        .eq('post_id', postId)
        .order('created_at', { ascending: true }),
      
      supabase
        .from('comments')
        .select('created_at')
        .eq('post_id', postId)
        .order('created_at', { ascending: true }),
      
      // Add shares analytics when implemented
      Promise.resolve({ data: [], error: null })
    ]);

    return {
      likes: likesData.data || [],
      comments: commentsData.data || [],
      shares: sharesData.data || []
    };
  }
}

export const newPostsService = NewPostsService;
