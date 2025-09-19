import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Post {
  id: string;
  content: string;
  created_at: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  user_id: string;
  author: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export const useFastPosts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch posts with user interaction data
  const { 
    data: posts = [], 
    isLoading: loading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['fast-posts'],
    queryFn: async () => {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get user's likes for these posts
      let userLikes: string[] = [];
      if (user && postsData?.length) {
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postsData.map(p => p.id));
        
        userLikes = likesData?.map(l => l.post_id) || [];
      }

      return postsData?.map(post => ({
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        image_url: post.image_url,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        is_liked: userLikes.includes(post.id),
        user_id: post.user_id,
        author: {
          id: post.profiles?.id || post.user_id,
          display_name: post.profiles?.display_name || 'Anonymous',
          avatar_url: post.profiles?.avatar_url
        }
      })) || [];
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string; image_url?: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          content: postData.content,
          user_id: user.id,
          image_url: postData.image_url,
          post_type: 'text',
          visibility: 'public'
        })
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newPost) => {
      // Add the new post to the beginning of the list
      queryClient.setQueryData(['fast-posts'], (oldPosts: Post[] = []) => [
        {
          id: newPost.id,
          content: newPost.content,
          created_at: newPost.created_at,
          image_url: newPost.image_url,
          likes_count: 0,
          comments_count: 0,
          is_liked: false,
          user_id: newPost.user_id,
          author: {
            id: newPost.profiles?.id || newPost.user_id,
            display_name: newPost.profiles?.display_name || user?.user_metadata?.full_name || 'You',
            avatar_url: newPost.profiles?.avatar_url || user?.user_metadata?.avatar_url
          }
        },
        ...oldPosts
      ]);

      toast({
        title: "Post created!",
        description: "Your post has been shared successfully."
      });
    },
    onError: (error: any) => {
      console.error('Error creating post:', error);
      toast({
        title: "Error creating post",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    }
  });

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error('User not authenticated');

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);
        return { isLiked: false };
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });
        return { isLiked: true };
      }
    },
    onMutate: async (postId: string) => {
      // Optimistic update
      queryClient.setQueryData(['fast-posts'], (oldPosts: Post[] = []) =>
        oldPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                is_liked: !post.is_liked,
                likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1
              }
            : post
        )
      );
    },
    onError: (error, postId) => {
      // Revert optimistic update
      queryClient.setQueryData(['fast-posts'], (oldPosts: Post[] = []) =>
        oldPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                is_liked: !post.is_liked,
                likes_count: post.is_liked ? post.likes_count + 1 : post.likes_count - 1
              }
            : post
        )
      );

      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive"
      });
    }
  });

  const createPost = useCallback((postData: { content: string; image_url?: string }) => {
    createPostMutation.mutate(postData);
  }, [createPostMutation]);

  const toggleLike = useCallback((postId: string) => {
    toggleLikeMutation.mutate(postId);
  }, [toggleLikeMutation]);

  const retry = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    posts,
    loading,
    error,
    createPost,
    isCreating: createPostMutation.isPending,
    toggleLike,
    isLiking: toggleLikeMutation.isPending,
    retry
  };
};