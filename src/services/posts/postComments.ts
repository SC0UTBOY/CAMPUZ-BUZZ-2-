
import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from '@/services/notificationService';

export class PostComments {
  // Enhanced comment method with notifications
  static async addComment(postId: string, content: string, parentId?: string): Promise<void> {
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

      // Add comment
      const { data: comment } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content,
          parent_id: parentId
        })
        .select(`
          *,
          profiles:user_id (display_name, avatar_url)
        `)
        .single();

      if (!comment) throw new Error('Failed to create comment');

      // Send notification to post author (if not commenting on own post)
      if (postData.user_id !== user.id) {
        const { data: commenterProfile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .single();

        const commenterName = commenterProfile?.display_name || 'Someone';
        
        await NotificationService.createNotification(
          postData.user_id,
          'comment',
          'New Comment',
          `${commenterName} commented on your post`,
          { 
            type: 'comment',
            postId: postId,
            commentId: comment.id,
            commenterId: user.id
          }
        );
      }

      // Check for mentions in comment content and send notifications
      await this.processMentions(content, user.id, 'comment', { postId, commentId: comment.id });

    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Process mentions in content and send notifications
  private static async processMentions(
    content: string, 
    authorId: string, 
    type: 'post' | 'comment', 
    metadata: any
  ): Promise<void> {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    if (mentions.length === 0) return;

    // Get mentioned users
    const { data: mentionedUsers } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('display_name', mentions);

    if (!mentionedUsers || mentionedUsers.length === 0) return;

    // Get author info
    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', authorId)
      .single();

    const authorName = authorProfile?.display_name || 'Someone';

    // Send notification to each mentioned user
    for (const mentionedUser of mentionedUsers) {
      if (mentionedUser.user_id !== authorId) { // Don't notify self
        await NotificationService.createNotification(
          mentionedUser.user_id,
          'mention',
          'You were mentioned',
          `${authorName} mentioned you in a ${type}`,
          { 
            type: 'mention',
            mentionType: type,
            authorId: authorId,
            ...metadata
          }
        );
      }
    }
  }
}
