import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { newPostsService } from '@/services/newPostsService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PostWithProfile } from '@/types/database';

interface UsePostLikesProps {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}

export const usePostLikes = ({ postId, initialLiked, initialCount }: UsePostLikesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      return await newPostsService.toggleLike(postId, user.id);
    },
    onMutate: async () => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData(['posts']);

      // Optimistically update to the new value
      queryClient.setQueryData(['posts'], (oldData: PostWithProfile[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map((post: PostWithProfile) =>
          post.id === postId
            ? {
                ...post,
                likes_count: isLiked ? likeCount - 1 : likeCount + 1,
                is_liked: !isLiked,
              }
            : post
        );
      });

      // Update local state optimistically
      setIsLiked((prev) => !prev);
      setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

      return { previousPosts };
    },
    onError: (err, newTodo, context) => {
      // Rollback on error
      queryClient.setQueryData(['posts'], context?.previousPosts);
      setIsLiked(initialLiked);
      setLikeCount(initialCount);
      toast({
        title: 'Error',
        description: err.message || 'Failed to update like. Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      // Invalidate cache to ensure fresh data is fetched
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onSuccess: (data) => {
      toast({
        title: data.isLiked ? 'Liked!' : 'Unliked',
        description: data.isLiked ? 'You liked this post' : 'You unliked this post',
      });
    },
  });

  const handleLike = useCallback(() => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to like posts.',
        variant: 'destructive',
      });
      return;
    }
    likeMutation.mutate();
  }, [likeMutation, user, toast]);

  return {
    isLiked,
    likeCount,
    handleLike,
    isLoading: likeMutation.isPending,
  };
};