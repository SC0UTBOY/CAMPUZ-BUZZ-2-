import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PostUpdate {
  id: string;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

export const useRealTimePostUpdates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [postUpdates, setPostUpdates] = useState<Map<string, PostUpdate>>(new Map());

  const subscribeToPostReactions = useCallback((postId: string) => {
    if (!user) return () => {};

    const channel = supabase
      .channel(`post-reactions-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_reactions',
          filter: `post_id=eq.${postId}`
        },
        async (payload) => {
          console.log('Post reaction update:', payload);
          
          // Refetch updated counts and user's reaction status
          const { data: post } = await supabase
            .from('posts')
            .select('id, likes_count')
            .eq('id', postId)
            .single();

          if (post) {
            // Check if current user has liked this post
            const { data: userReaction } = await supabase
              .from('post_reactions')
              .select('id')
              .eq('post_id', postId)
              .eq('user_id', user.id)
              .eq('reaction_type', 'like')
              .maybeSingle();

            setPostUpdates(prev => new Map(prev.set(postId, {
              id: postId,
              likes_count: post.likes_count,
              is_liked: !!userReaction
            })));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const subscribeToPostComments = useCallback((postId: string) => {
    const channel = supabase
      .channel(`post-comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        async (payload) => {
          console.log('Post comment update:', payload);
          
          // Refetch updated comment count
          const { data: post } = await supabase
            .from('posts')
            .select('id, comments_count')
            .eq('id', postId)
            .single();

          if (post) {
            setPostUpdates(prev => {
              const existing = prev.get(postId) || { id: postId };
              return new Map(prev.set(postId, {
                ...existing,
                comments_count: post.comments_count
              }));
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const subscribeToPost = useCallback((postId: string) => {
    const unsubscribeReactions = subscribeToPostReactions(postId);
    const unsubscribeComments = subscribeToPostComments(postId);

    return () => {
      unsubscribeReactions();
      unsubscribeComments();
    };
  }, [subscribeToPostReactions, subscribeToPostComments]);

  const getPostUpdate = useCallback((postId: string): PostUpdate | undefined => {
    return postUpdates.get(postId);
  }, [postUpdates]);

  const clearPostUpdate = useCallback((postId: string) => {
    setPostUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(postId);
      return newMap;
    });
  }, []);

  return {
    subscribeToPost,
    getPostUpdate,
    clearPostUpdate,
    postUpdates: Object.fromEntries(postUpdates)
  };
};