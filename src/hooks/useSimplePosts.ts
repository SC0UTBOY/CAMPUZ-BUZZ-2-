import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newPostsService } from '@/services/newPostsService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { PostInsert, PostUpdate, PostWithProfile } from '@/types/database';

export const useSimplePosts = (communityId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get posts query - simple version
  const {
    data: posts,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['posts', communityId],
    queryFn: async () => {
      return await newPostsService.getPosts(20, 0, communityId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: PostInsert) => {
      if (!user) throw new Error('User not authenticated');
      return await newPostsService.createPost(postData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
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

  // Like post mutation - FIXED VERSION
  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await newPostsService.toggleLike(postId);
    },
    onSuccess: (data, postId) => {
      // Optimistically update the cache immediately
      queryClient.setQueryData(['posts', communityId], (oldData: any) => {
        if (!oldData) return oldData;
        
        return oldData.map((post: any) => 
          post.id === postId 
            ? { 
                ...post, 
                likes_count: data.likeCount,
                is_liked: data.isLiked 
              }
            : post
        );
      });
      
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      toast({
        title: data.isLiked ? 'Liked!' : 'Unliked',
        description: data.isLiked ? 'You liked this post' : 'You unliked this post'
      });
    },
    onError: (error: any) => {
      console.error('Like mutation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to like post. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Helper functions
  const createPost = useCallback((postData: any) => {
    console.log('Creating post with data:', postData);
    
    const transformedData: PostInsert = {
      user_id: user?.id || '',
      content: postData.content,
      title: postData.title || null,
      post_type: postData.post_type || postData.type || (postData.image ? 'image' : 'text'),
      visibility: 'public',
      tags: postData.tags || [],
      image_url: postData.image || null,
    };
    
    console.log('Transformed data for database:', transformedData);
    createPostMutation.mutate(transformedData);
  }, [createPostMutation, user]);

  const likePost = useCallback(async (postId: string) => {
    return new Promise<void>((resolve, reject) => {
      likePostMutation.mutate(postId, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error)
      });
    });
  }, [likePostMutation]);

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await newPostsService.deletePost(postId);
    },
    onSuccess: (_, postId) => {
      // Remove the post from the cache immediately
      queryClient.setQueryData(['posts', communityId], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((post: any) => post.id !== postId);
      });
      
      toast({
        title: 'Post Deleted',
        description: 'Your post has been deleted successfully.'
      });
    },
    onError: (error: any) => {
      console.error('Delete post error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete post. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const deletePost = useCallback(async (postId: string) => {
    return new Promise<void>((resolve, reject) => {
      deletePostMutation.mutate(postId, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error)
      });
    });
  }, [deletePostMutation]);

  return {
    // Data
    posts: posts || [],
    isLoading,
    error,

    // Actions
    createPost,
    likePost,
    deletePost,
    refetch,

    // Loading states
    isCreating: createPostMutation.isPending,
    isLiking: likePostMutation.isPending,
    isDeleting: deletePostMutation.isPending,
  };
};

export default useSimplePosts;
