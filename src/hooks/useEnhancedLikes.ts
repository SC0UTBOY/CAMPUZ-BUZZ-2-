import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
// import { useDebounce } from '@/hooks/useDebounce';

interface LikeState {
  isLiked: boolean;
  count: number;
}

interface PostLikeData {
  postId: string;
  isLiked: boolean;
  count: number;
}

export const useEnhancedLikes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localStates, setLocalStates] = useState<Record<string, LikeState>>({});
  const pendingActions = useRef<Set<string>>(new Set());

  // Simple like action without debouncing for now
  const likeAction = useCallback(async (postId: string, isLiked: boolean) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      if (isLiked) {
        // Add like
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;
      } else {
        // Remove like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      // Update the post's like count in the database
      await supabase.rpc('update_post_like_count', {
        post_id: postId
      });

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['fast-posts'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });

    } catch (error) {
      console.error('Error updating like:', error);
      throw error;
    }
  }, [user, queryClient]);

  const likeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      await likeAction(postId, isLiked);
    },
    onError: (error, { postId }) => {
      console.error('Like mutation failed:', error);
      
      // Revert optimistic update
      setLocalStates(prev => {
        const current = prev[postId];
        if (current) {
          return {
            ...prev,
            [postId]: {
              isLiked: !current.isLiked,
              count: current.isLiked ? current.count + 1 : current.count - 1
            }
          };
        }
        return prev;
      });

      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: (_, __, { postId }) => {
      // Remove from pending actions
      pendingActions.current.delete(postId);
    }
  });

  const toggleLike = useCallback(async (postId: string, isLiked: boolean) => {
    // Prevent duplicate actions
    if (pendingActions.current.has(postId)) {
      return;
    }

    // Add to pending actions
    pendingActions.current.add(postId);

    // Optimistic update
    setLocalStates(prev => {
      const current = prev[postId];
      const newState = {
        isLiked,
        count: isLiked 
          ? (current?.count || 0) + 1 
          : Math.max((current?.count || 1) - 1, 0)
      };

      return {
        ...prev,
        [postId]: newState
      };
    });

    // Trigger mutation
    likeMutation.mutate({ postId, isLiked });
  }, [likeMutation]);

  const getLikeState = useCallback((postId: string, initialLiked: boolean, initialCount: number): LikeState => {
    const localState = localStates[postId];
    if (localState) {
      return localState;
    }
    return {
      isLiked: initialLiked,
      count: initialCount
    };
  }, [localStates]);

  const isLiking = useCallback((postId: string): boolean => {
    return pendingActions.current.has(postId) || likeMutation.isPending;
  }, [likeMutation.isPending]);

  return {
    toggleLike,
    getLikeState,
    isLiking,
    isPending: likeMutation.isPending
  };
};

export default useEnhancedLikes;
