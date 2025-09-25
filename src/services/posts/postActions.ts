
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/posts';
import { safeParseReactions } from './postTransformers';

export class PostActions {
  static async createPost(postData: {
    content: string;
    title?: string;
    post_type: 'text' | 'image' | 'video' | 'poll';
    user_id: string;
    visibility: 'public' | 'friends' | 'private';
    tags?: string[];
    mentions?: string[];
    image_url?: string;
  }): Promise<Post> {
    try {
      const insertData = {
        content: postData.content,
        title: postData.title,
        post_type: postData.post_type,
        user_id: postData.user_id,
        visibility: postData.visibility,
        tags: postData.tags || [],
        image_url: postData.image_url,
        reactions: {} as Record<string, any>,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        saves_count: 0,
      };

      const { data, error } = await supabase
        .from('posts')
        .insert([insertData])
        .select('*')
        .single();

      if (error) {
        console.error('Error creating post:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from post creation');
      }

      // Safely parse reactions with proper type checking
      const reactions = safeParseReactions(data.reactions);

      return {
        ...data,
        post_type: data.post_type as 'text' | 'image' | 'video' | 'poll',
        visibility: data.visibility as 'public' | 'friends' | 'private',
        hashtags: [],
        mentions: [],
        reactions,
      } as Post;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  static async savePost(postId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if the post is already saved
      const { data: existingSave } = await supabase
        .from('post_saves')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingSave) {
        // If it's saved, remove the save
        await supabase
          .from('post_saves')
          .delete()
          .eq('id', existingSave.id);
      } else {
        // If it's not saved, add a save
        await supabase
          .from('post_saves')
          .insert({
            post_id: postId,
            user_id: user.id
          });
      }
    } catch (error) {
      console.error('Error saving post:', error);
      throw error;
    }
  }

  static async sharePost(postId: string): Promise<void> {
    try {
      // Sharing logic (can be implemented later)
      console.log(`Post ${postId} shared`);
    } catch (error) {
      console.error('Error sharing post:', error);
      throw error;
    }
  }
}
