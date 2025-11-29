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
      // 1. Fetch posts without join
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!postsData?.length) return [];

      // 2. Fetch user data from auth.users to get metadata
      const userIds = [...new Set(postsData.map(p => p.user_id))];

      // Fetch auth users data using admin API or RPC
      // Since we can't directly query auth.users, we'll use the profiles view
      // but also fetch from auth metadata for the current user
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, username')
        .in('id', userIds);

      // Create a map of profiles
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

      // For each user without profile data, try to get from auth metadata
      // This is a workaround since profiles view might not have all data
      for (const userId of userIds) {
        if (!profilesMap.has(userId) || !profilesMap.get(userId)?.display_name) {
          // Try to get user data from auth - this will only work for the current user
          if (user && user.id === userId) {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
              profilesMap.set(userId, {
                id: authUser.id,
                display_name: authUser.user_metadata?.display_name ||
                  authUser.user_metadata?.full_name ||
                  authUser.email?.split('@')[0] ||
                  'User',
                avatar_url: authUser.user_metadata?.avatar_url,
                username: authUser.user_metadata?.username
              });
            }
          }
        }
      }

      // 3. Get user's likes for these posts
      let userLikes: string[] = [];
      if (user) {
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postsData.map(p => p.id));

        userLikes = likesData?.map(l => l.post_id) || [];
      }

      return postsData.map(post => {
        const profile = profilesMap.get(post.user_id);
        return {
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          image_url: post.image_url,
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          is_liked: userLikes.includes(post.id),
          user_id: post.user_id,
          author: {
            id: post.user_id,
            display_name: profile?.display_name || profile?.username || 'Anonymous',
            avatar_url: profile?.avatar_url
          }
        };
      });
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

      // First, ensure user metadata has display_name
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      let displayName = currentUser?.user_metadata?.display_name ||
        currentUser?.user_metadata?.full_name ||
        currentUser?.email?.split('@')[0];

      // If no display name in metadata, update it
      if (!currentUser?.user_metadata?.display_name && displayName) {
        await supabase.auth.updateUser({
          data: {
            display_name: displayName
          }
        });
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          content: postData.content,
          user_id: user.id,
          image_url: postData.image_url,
          post_type: 'text',
          visibility: 'public',
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: async (newPost) => {
      // Get fresh user data for the new post
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const displayName = currentUser?.user_metadata?.display_name ||
        currentUser?.user_metadata?.full_name ||
        currentUser?.email?.split('@')[0] ||
        'You';

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
            id: newPost.user_id,
            display_name: displayName,
            avatar_url: currentUser?.user_metadata?.avatar_url
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

      // Check if already liked - use maybeSingle to avoid errors
      const { data: existingLike, error: checkError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      let isLiked: boolean;

      if (existingLike) {
        // Unlike - remove the like
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
        isLiked = false;
      } else {
        // Like - insert new like (unique constraint prevents duplicates)
        const { error: insertError } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        // Handle duplicate key error gracefully
        if (insertError && insertError.code !== '23505') {
          throw insertError;
        }
        isLiked = true;
      }

      // Get actual like count from database
      const { count, error: countError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (countError) throw countError;

      return { isLiked, likeCount: count || 0 };
    },
    onSuccess: (result, postId) => {
      // Update post with actual like count from database
      queryClient.setQueryData(['fast-posts'], (oldPosts: Post[] = []) =>
        oldPosts.map(post =>
          post.id === postId
            ? {
              ...post,
              is_liked: result.isLiked,
              likes_count: result.likeCount
            }
            : post
        )
      );
    },
    onError: (error: any) => {
      console.error('Error toggling like:', error);
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