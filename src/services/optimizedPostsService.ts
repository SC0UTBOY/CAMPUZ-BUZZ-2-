
import { supabase } from '@/integrations/supabase/client';
import { Post, PostFilter, EnhancedPostData } from '@/types/posts';

class OptimizedPostsService {
  // Optimized posts query with proper joins and indexing
  async getPosts(filters: PostFilter = {}, page: number = 0, limit: number = 20): Promise<EnhancedPostData[]> {
    try {
      let query = supabase
        .from('posts')
        .select(`
          id,
          user_id,
          title,
          content,
          image_url,
          post_type,
          tags,
          likes_count,
          comments_count,
          shares_count,
          saves_count,
          visibility,
          community_id,
          reactions,
          hashtags,
          mentions,
          created_at,
          updated_at,
          profiles:user_id (
            user_id,
            display_name,
            avatar_url,
            major,
            year
          )
        `)
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      // Apply filters efficiently using indexes
      if (filters.type) {
        query = query.eq('post_type', filters.type);
      }
      if (filters.visibility) {
        query = query.eq('visibility', filters.visibility);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(post => this.transformPost(post));
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  // Get user interactions for posts (likes, saves) in batch
  async getUserInteractions(postIds: string[], userId: string): Promise<{
    likes: Record<string, boolean>;
    saves: Record<string, boolean>;
  }> {
    try {
      const [likesData, savesData] = await Promise.all([
        supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', userId)
          .in('post_id', postIds),
        supabase
          .from('post_saves')
          .select('post_id')
          .eq('user_id', userId)
          .in('post_id', postIds)
      ]);

      const likes: Record<string, boolean> = {};
      const saves: Record<string, boolean> = {};

      likesData.data?.forEach(like => {
        if (like.post_id) likes[like.post_id] = true;
      });

      savesData.data?.forEach(save => {
        saves[save.post_id] = true;
      });

      return { likes, saves };
    } catch (error) {
      console.error('Error fetching user interactions:', error);
      return { likes: {}, saves: {} };
    }
  }

  // Create post with proper validation and indexing
  async createPost(postData: {
    content: string;
    title?: string;
    post_type: 'text' | 'image' | 'video' | 'poll';
    visibility: 'public' | 'friends' | 'private';
    tags?: string[];
    image_url?: string;
    community_id?: string;
  }): Promise<EnhancedPostData> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: postData.content,
          title: postData.title,
          post_type: postData.post_type,
          visibility: postData.visibility,
          tags: postData.tags || [],
          image_url: postData.image_url,
          community_id: postData.community_id,
          hashtags: this.extractHashtags(postData.content),
          mentions: this.extractMentions(postData.content)
        })
        .select(`
          *,
          profiles:user_id (
            user_id,
            display_name,
            avatar_url,
            major,
            year
          )
        `)
        .single();

      if (error) throw error;

      return this.transformPost(data);
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  // Optimized like toggle with proper counting
  async toggleLike(postId: string): Promise<{ isLiked: boolean; newCount: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLike) {
        // Unlike - trigger will handle count update
        await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);

        const { data: post } = await supabase
          .from('posts')
          .select('likes_count')
          .eq('id', postId)
          .single();

        return { isLiked: false, newCount: post?.likes_count || 0 };
      } else {
        // Like - trigger will handle count update
        await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        const { data: post } = await supabase
          .from('posts')
          .select('likes_count')
          .eq('id', postId)
          .single();

        return { isLiked: true, newCount: post?.likes_count || 0 };
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  // Transform database post to client format
  private transformPost(dbPost: any): EnhancedPostData {
    const profile = Array.isArray(dbPost.profiles) ? dbPost.profiles[0] : dbPost.profiles;
    
    return {
      id: dbPost.id,
      user_id: dbPost.user_id,
      title: dbPost.title,
      content: dbPost.content,
      image_url: dbPost.image_url,
      post_type: dbPost.post_type as 'text' | 'image' | 'video' | 'poll',
      tags: dbPost.tags || [],
      likes_count: dbPost.likes_count || 0,
      comments_count: dbPost.comments_count || 0,
      shares_count: dbPost.shares_count || 0,
      saves_count: dbPost.saves_count || 0,
      visibility: dbPost.visibility as 'public' | 'friends' | 'private',
      hashtags: dbPost.hashtags || [],
      mentions: dbPost.mentions || [],
      reactions: dbPost.reactions || {},
      created_at: dbPost.created_at,
      updated_at: dbPost.updated_at,
      author: {
        id: dbPost.user_id,
        display_name: profile?.display_name || 'Anonymous User',
        avatar_url: profile?.avatar_url,
        major: profile?.major,
        year: profile?.year,
      },
      is_liked: false, // Will be populated by getUserInteractions
      is_saved: false, // Will be populated by getUserInteractions
    } as EnhancedPostData;
  }

  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const hashtags = [];
    let match;
    while ((match = hashtagRegex.exec(content)) !== null) {
      hashtags.push(match[1].toLowerCase());
    }
    return hashtags;
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  }
}

export const optimizedPostsService = new OptimizedPostsService();
