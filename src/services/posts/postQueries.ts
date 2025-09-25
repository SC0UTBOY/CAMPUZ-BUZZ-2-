
import { supabase } from '@/integrations/supabase/client';
import { PostFilter, EnhancedPostData, DatabasePost } from '@/types/posts';
import { transformDatabasePostToPost } from './postTransformers';

const PAGE_SIZE = 20;

export class PostQueries {
  static async getPosts(filter: PostFilter = {}, page: number = 0): Promise<EnhancedPostData[]> {
    let query = supabase
      .from('posts')
      .select(
        `
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
        created_at,
        updated_at,
        visibility,
        community_id,
        file_name,
        file_url,
        is_pinned,
        reactions,
        profiles:user_id (
          id,
          display_name,
          avatar_url,
          major,
          year
        )
      `
      )
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filter.type) {
      query = query.eq('post_type', filter.type);
    }

    if (filter.visibility) {
      query = query.eq('visibility', filter.visibility);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    return data
      .filter((item): item is NonNullable<typeof item> => {
        if (!item || typeof item !== 'object' || !('id' in item)) {
          console.warn('Invalid post data received:', item);
          return false;
        }
        return true;
      })
      .map((validItem) => {
        // Use type assertion to tell TypeScript this is the expected structure
        const rawPost = validItem as any;
        
        // Create a proper DatabasePost object
        const post: DatabasePost = {
          id: rawPost.id,
          user_id: rawPost.user_id,
          title: rawPost.title || undefined,
          content: rawPost.content,
          image_url: rawPost.image_url || undefined,
          post_type: rawPost.post_type,
          tags: rawPost.tags || [],
          likes_count: rawPost.likes_count || 0,
          comments_count: rawPost.comments_count || 0,
          shares_count: rawPost.shares_count || 0,
          saves_count: rawPost.saves_count || 0,
          created_at: rawPost.created_at,
          updated_at: rawPost.updated_at,
          visibility: rawPost.visibility,
          hashtags: [], // Default empty array since column doesn't exist
          mentions: [], // Default empty array since column doesn't exist
          community_id: rawPost.community_id || undefined,
          file_name: rawPost.file_name || undefined,
          file_url: rawPost.file_url || undefined,
          is_pinned: rawPost.is_pinned || false,
          reactions: rawPost.reactions,
          profiles: rawPost.profiles,
        };
        
        // Safely access profiles with null check
        const profile = post.profiles && Array.isArray(post.profiles) 
          ? post.profiles[0] 
          : post.profiles;
        
        return transformDatabasePostToPost(post, profile);
      });
  }
}
