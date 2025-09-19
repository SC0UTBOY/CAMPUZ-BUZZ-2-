import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { debugLikesService } from '@/services/debugLikesService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface LikeState {
  isLiked: boolean;
  count: number;
  isLoading: boolean;
}

export const useDebugLikes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localStates, setLocalStates] = useState<Record<string, LikeState>>({});

  // Debug the likes table on mount
  useEffect(() => {
    debugLikesService.debugLikesTable();
  }, []);

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      console.log('🚀 Like mutation started for postId:', postId);
      if (!user) {
        throw new Error('Please log in to like posts');
      }
      return await debugLikesService.toggleLike(postId);
    },
    onMutate: async (postId: string) => {
      console.log('⏳ Like mutation onMutate for postId:', postId);
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      // Snapshot the previous value
      const previousState = localStates[postId];
      console.log('📸 Previous state:', previousState);

      // Optimistically update
      setLocalStates(prev => {
        const newState = {
          ...prev,
          [postId]: {
            ...prev[postId],
            isLoading: true
          }
        };
        console.log('🔄 Optimistic update:', newState[postId]);
        return newState;
      });

      return { previousState, postId };
    },
    onSuccess: (result, postId) => {
      console.log('✅ Like mutation success:', { result, postId });
      
      // Update local state with server response
      setLocalStates(prev => ({
        ...prev,
        [postId]: {
          isLiked: result.isLiked,
          count: result.likeCount,
          isLoading: false
        }
      }));

      // Invalidate and refetch posts
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['fast-posts'] });
      
      toast({
        title: result.isLiked ? "Liked!" : "Unliked!",
        description: `Post ${result.isLiked ? 'liked' : 'unliked'} successfully.`
      });
    },
    onError: (error: any, postId, context) => {
      console.error('❌ Like mutation error:', { error, postId, context });
      
      // Revert optimistic update
      if (context?.previousState) {
        setLocalStates(prev => ({
          ...prev,
          [postId]: {
            ...context.previousState,
            isLoading: false
          }
        }));
      } else {
        setLocalStates(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            isLoading: false
          }
        }));
      }

      toast({
        title: "Error",
        description: error.message || "Failed to update like. Please try again.",
        variant: "destructive"
      });
    }
  });

  const toggleLike = useCallback(async (postId: string) => {
    console.log('🎯 toggleLike called for postId:', postId);
    
    if (!user) {
      console.log('❌ User not authenticated');
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
    console.log('📊 Current like state:', { currentState, currentIsLiked });

    // Optimistic update
    setLocalStates(prev => {
      const newState = {
        ...prev,
        [postId]: {
          isLiked: !currentIsLiked,
          count: currentIsLiked 
            ? Math.max((prev[postId]?.count || 1) - 1, 0)
            : (prev[postId]?.count || 0) + 1,
          isLoading: true
        }
      };
      console.log('🔄 Optimistic state update:', newState[postId]);
      return newState;
    });

    // Trigger mutation
    console.log('🚀 Triggering mutation...');
    likeMutation.mutate(postId);
  }, [user, toast, likeMutation, localStates]);

  const getLikeState = useCallback((postId: string, initialLiked: boolean, initialCount: number): LikeState => {
    const localState = localStates[postId];
    if (localState) {
      console.log('📊 Using local state for postId:', postId, localState);
      return localState;
    }
    
    const defaultState = {
      isLiked: initialLiked,
      count: initialCount,
      isLoading: false
    };
    console.log('📊 Using default state for postId:', postId, defaultState);
    return defaultState;
  }, [localStates]);

  const isLiking = useCallback((postId: string): boolean => {
    const loading = localStates[postId]?.isLoading || false;
    console.log('⏳ isLiking check for postId:', postId, loading);
    return loading;
  }, [localStates]);

  return {
    toggleLike,
    getLikeState,
    isLiking,
    isPending: likeMutation.isPending
  };
};

export default useDebugLikes;
