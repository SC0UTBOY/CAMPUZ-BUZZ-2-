
import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from '@/services/notificationService';

export class PostReactions {
  // Enhanced reaction method with notifications
  static async reactToPost(postId: string, reactionType: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get post details for notification
      const { data: postData } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (display_name, avatar_url)
        `)
        .eq('id', postId)
        .single();

      if (!postData) throw new Error('Post not found');

      // Check if user already reacted with this type
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
        // Remove any other reactions from this user first
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

        // Send notification to post author (if not reacting to own post)
        if (postData.user_id !== user.id) {
          const profile = Array.isArray(postData.profiles) ? postData.profiles[0] : postData.profiles;
          const userName = profile?.display_name || 'Someone';
          
          const reactionEmoji = this.getReactionEmoji(reactionType);
          await NotificationService.createNotification(
            postData.user_id,
            'like',
            'New Reaction',
            `${userName} reacted ${reactionEmoji} to your post`,
            { 
              type: 'reaction',
              postId: postId,
              reactionType: reactionType,
              reactorId: user.id
            }
          );
        }
      }
    } catch (error) {
      console.error('Error reacting to post:', error);
      throw error;
    }
  }

  private static getReactionEmoji(reactionType: string): string {
    const emojiMap: Record<string, string> = {
      like: '👍',
      love: '❤️',
      laugh: '😂',
      wow: '😮',
      sad: '😢',
      angry: '😠'
    };
    return emojiMap[reactionType] || '👍';
  }
}
