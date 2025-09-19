import { useState, useCallback } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newPostsService } from '@/services/newPostsService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { PostInsert, PostUpdate, PostWithProfile } from '@/types/database';

export const useNewPosts = (communityId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get posts query
  const {
    data: posts,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useQuery({
    queryKey: ['posts', communityId],
    queryFn: async ({ pageParam = 0 }) => {
      return await newPostsService.getPosts(20, pageParam * 20, communityId);
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === 20 ? pages.length : undefined;
    }
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: PostInsert) => {
      if (!user) throw new Error('User not authenticated');
      return await newPostsService.createPost({
        ...postData,
        user_id: user.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-feed'] });
      toast({
        title: 'Success',
        description: 'Post created successfully!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create post',
        variant: 'destructive'
      });
    }
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: async ({ postId, updates }: { postId: string; updates: PostUpdate }) => {
      return await newPostsService.updatePost(postId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        title: 'Success',
        description: 'Post updated successfully!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update post',
        variant: 'destructive'
      });
    }
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await newPostsService.deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        title: 'Success',
        description: 'Post deleted successfully!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete post',
        variant: 'destructive'
      });
    }
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await newPostsService.toggleLike(postId);
    },
    onSuccess: (data, postId) => {
      // Optimistically update the cache
      queryClient.setQueryData(['posts', communityId], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: PostWithProfile[]) =>
            page.map((post: PostWithProfile) =>
              post.id === postId
                ? { ...post, likes_count: data.likeCount }
                : post
            )
          )
        };
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to like post',
        variant: 'destructive'
      });
    }
  });

  // Save post mutation
  const savePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await newPostsService.toggleSave(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-posts'] });
      toast({
        title: 'Success',
        description: 'Post saved successfully!'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save post',
        variant: 'destructive'
      });
    }
  });

  // Report post mutation
  const reportPostMutation = useMutation({
    mutationFn: async ({
      postId,
      reason,
      description,
      category
    }: {
      postId: string;
      reason: string;
      description?: string;
      category?: string;
    }) => {
      return await newPostsService.reportPost(postId, reason, description, category);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Post reported successfully. We will review it shortly.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to report post',
        variant: 'destructive'
      });
    }
  });

  // Helper functions
  const createPost = useCallback((postData: PostInsert) => {
    createPostMutation.mutate(postData);
  }, [createPostMutation]);

  const updatePost = useCallback((postId: string, updates: PostUpdate) => {
    updatePostMutation.mutate({ postId, updates });
  }, [updatePostMutation]);

  const deletePost = useCallback((postId: string) => {
    deletePostMutation.mutate(postId);
  }, [deletePostMutation]);

  const likePost = useCallback((postId: string) => {
    likePostMutation.mutate(postId);
  }, [likePostMutation]);

  const savePost = useCallback((postId: string) => {
    savePostMutation.mutate(postId);
  }, [savePostMutation]);

  const reportPost = useCallback((
    postId: string,
    reason: string,
    description?: string,
    category?: string
  ) => {
    reportPostMutation.mutate({ postId, reason, description, category });
  }, [reportPostMutation]);

  return {
    // Data
    posts: posts?.pages.flat() || [],
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,

    // Actions
    createPost,
    updatePost,
    deletePost,
    likePost,
    savePost,
    reportPost,
    fetchNextPage,

    // Loading states
    isCreating: createPostMutation.isPending,
    isUpdating: updatePostMutation.isPending,
    isDeleting: deletePostMutation.isPending,
    isLiking: likePostMutation.isPending,
    isSaving: savePostMutation.isPending,
    isReporting: reportPostMutation.isPending
  };
};

// Hook for user feed
export const useUserFeed = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: feedItems,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useQuery({
    queryKey: ['user-feed', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user) return [];
      return await newPostsService.getUserFeed(user.id, 20, pageParam * 20);
    },
    enabled: !!user,
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === 20 ? pages.length : undefined;
    }
  });

  return {
    feedItems: feedItems?.pages.flat() || [],
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  };
};

// Hook for trending posts
export const useTrendingPosts = () => {
  const { data: trendingPosts, isLoading, error } = useQuery({
    queryKey: ['trending-posts'],
    queryFn: () => newPostsService.getTrendingPosts(20),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    trendingPosts: trendingPosts || [],
    isLoading,
    error
  };
};

// Hook for saved posts
export const useSavedPosts = () => {
  const { user } = useAuth();

  const {
    data: savedPosts,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useQuery({
    queryKey: ['saved-posts', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user) return [];
      return await newPostsService.getSavedPosts(user.id, 20, pageParam * 20);
    },
    enabled: !!user,
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === 20 ? pages.length : undefined;
    }
  });

  return {
    savedPosts: savedPosts?.pages.flat() || [],
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  };
};

// Hook for user's own posts
export const useUserPosts = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const {
    data: userPosts,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useQuery({
    queryKey: ['user-posts', targetUserId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!targetUserId) return [];
      return await newPostsService.getUserPosts(targetUserId, 20, pageParam * 20);
    },
    enabled: !!targetUserId,
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === 20 ? pages.length : undefined;
    }
  });

  return {
    userPosts: userPosts?.pages.flat() || [],
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  };
};
