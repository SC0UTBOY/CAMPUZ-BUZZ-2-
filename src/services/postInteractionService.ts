import { supabase } from '@/integrations/supabase/client';

export class PostInteractionService {
  // Like/Unlike functionality using the likes table
  static async toggleLike(postId: string): Promise<{ isLiked: boolean; newCount: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingLike) {
        // Unlike - remove the like
        await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);
      } else {
        // Like - add new like
        await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });
      }

      // Get updated count
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      return {
        isLiked: !existingLike,
        newCount: count || 0
      };
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  // Add comment functionality
  static async addComment(postId: string, content: string, parentId?: string): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
          parent_id: parentId || null,
          depth: parentId ? 1 : 0
        })
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Delete post functionality with authorization check
  static async deletePost(postId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First check if the user owns the post
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (!post) {
        throw new Error('Post not found');
      }

      if (post.user_id !== user.id) {
        throw new Error('Access denied: You can only delete your own posts');
      }

      // Use the secure deletion function
      const { error } = await supabase.rpc('delete_post_cascade', {
        post_uuid: postId
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // React to post with different reaction types
  static async reactToPost(postId: string, reactionType: string = 'like'): Promise<{ hasReacted: boolean; count: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if already reacted with this type
      const { data: existingReaction } = await supabase
        .from('post_reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType)
        .maybeSingle();

      if (existingReaction) {
        // Remove existing reaction
        await supabase
          .from('post_reactions')
          .delete()
          .eq('id', existingReaction.id);
      } else {
        // Remove any other reactions from this user first (only one reaction type per user)
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        // Add new reaction
        await supabase
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType
          });
      }

      // Get updated count for this reaction type
      const { count } = await supabase
        .from('post_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
        .eq('reaction_type', reactionType);

      return {
        hasReacted: !existingReaction,
        count: count || 0
      };
    } catch (error) {
      console.error('Error reacting to post:', error);
      throw error;
    }
  }

  // Get post with user interaction data
  static async getPostWithInteractions(postId: string): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: post, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url
          ),
          likes:likes!post_id (count),
          comments:comments!post_id (count)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;

      // Get user's interactions with this post if authenticated
      let isLiked = false;
      let reactions = {};

      if (user) {
        const { data: userLike } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();

        isLiked = !!userLike;

        // Get user's reaction
        const { data: userReactions } = await supabase
          .from('post_reactions')
          .select('reaction_type')
          .eq('post_id', postId)
          .eq('user_id', user.id);

        reactions = userReactions?.reduce((acc, reaction) => {
          acc[reaction.reaction_type] = true;
          return acc;
        }, {} as Record<string, boolean>) || {};
      }

      return {
        ...post,
        is_liked: isLiked,
        user_reactions: reactions
      };
    } catch (error) {
      console.error('Error getting post with interactions:', error);
      throw error;
    }
  }
}