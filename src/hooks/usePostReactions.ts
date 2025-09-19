import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PostReactions } from '@/services/posts/postReactions';
import { useToast } from '@/hooks/use-toast';

export const usePostReactions = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reactionMutation = useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: string; reactionType: string }) => {
      await PostReactions.reactToPost(postId, reactionType);
    },
    onMutate: ({ postId }) => {
      setLoadingStates(prev => ({ ...prev, [postId]: true }));
    },
    onSuccess: (_, { postId }) => {
      // Invalidate posts queries to refresh the feed
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      
      toast({
        description: "Reaction updated successfully",
      });
    },
    onError: (error, { postId }) => {
      console.error('Error reacting to post:', error);
      toast({
        title: "Error",
        description: "Failed to update reaction. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: (_, __, { postId }) => {
      setLoadingStates(prev => ({ ...prev, [postId]: false }));
    }
  });

  const reactToPost = useCallback((postId: string, reactionType: string = 'like') => {
    if (loadingStates[postId]) return;
    reactionMutation.mutate({ postId, reactionType });
  }, [reactionMutation, loadingStates]);

  return {
    reactToPost,
    isLoading: (postId: string) => loadingStates[postId] || false,
    isReacting: reactionMutation.isPending
  };
};