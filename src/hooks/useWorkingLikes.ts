import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ultraSimpleLikes } from '@/services/ultraSimpleLikes';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface LikeState {
  isLiked: boolean;
  count: number;
  isLoading: boolean;
}

export const useWorkingLikes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localStates, setLocalStates] = useState<Record<string, LikeState>>({});

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) {
        throw new Error('Please log in to like posts');
      }
      return await ultraSimpleLikes.toggleLike(postId);
    },
    onSuccess: (result, postId) => {
      // Update local state with server response
      setLocalStates(prev => ({
        ...prev,
        [postId]: {
          isLiked: result.isLiked,
          count: result.likeCount,
          isLoading: false
        }
      }));

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['fast-posts'] });
    },
    onError: (error: any, postId) => {
      // Revert loading state
      setLocalStates(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          isLoading: false
        }
      }));

      toast({
        title: "Error",
        description: error.message || "Failed to update like. Please try again.",
        variant: "destructive"
      });
    }
  });

  const toggleLike = useCallback(async (postId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like posts.",
        variant: "destructive"
      });
      return;
    }

    // Get current state
    const currentState = localStates[postId];
    const currentIsLiked = currentState?.isLiked || false;

    // Optimistic update
    setLocalStates(prev => ({
      ...prev,
      [postId]: {
        isLiked: !currentIsLiked,
        count: currentIsLiked 
          ? Math.max((prev[postId]?.count || 1) - 1, 0)
          : (prev[postId]?.count || 0) + 1,
        isLoading: true
      }
    }));

    // Trigger mutation
    likeMutation.mutate(postId);
  }, [user, toast, likeMutation, localStates]);

  const getLikeState = useCallback((postId: string, initialLiked: boolean, initialCount: number): LikeState => {
    const localState = localStates[postId];
    if (localState) {
      return localState;
    }
    return {
      isLiked: initialLiked,
      count: initialCount,
      isLoading: false
    };
  }, [localStates]);

  const isLiking = useCallback((postId: string): boolean => {
    return localStates[postId]?.isLoading || false;
  }, [localStates]);

  return {
    toggleLike,
    getLikeState,
    isLiking,
    isPending: likeMutation.isPending
  };
};

export default useWorkingLikes;
