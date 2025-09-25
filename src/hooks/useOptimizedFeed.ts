
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { optimizedPostsService } from '@/services/optimizedPostsService';
import { EnhancedPostData, PostFilter } from '@/types/posts';
import { useToast } from '@/hooks/use-toast';

export const useOptimizedFeed = (filters: PostFilter = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<EnhancedPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const loadPosts = useCallback(async (pageNum: number = 0, reset: boolean = false) => {
    try {
      if (pageNum === 0) setLoading(true);
      setError(null);

      const newPosts = await optimizedPostsService.getPosts(filters, pageNum);
      
      // Get user interactions for all posts at once
      let interactions = { likes: {}, saves: {} };
      if (user && newPosts.length > 0) {
        const postIds = newPosts.map(post => post.id);
        interactions = await optimizedPostsService.getUserInteractions(postIds, user.id);
      }

      // Apply user interactions to posts
      const postsWithInteractions = newPosts.map(post => ({
        ...post,
        is_liked: interactions.likes[post.id] || false,
        is_saved: interactions.saves[post.id] || false
      }));

      if (reset || pageNum === 0) {
        setPosts(postsWithInteractions);
      } else {
        setPosts(prev => [...prev, ...postsWithInteractions]);
      }

      setHasMore(newPosts.length === 20); // Assuming page size of 20
      setPage(pageNum);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
      toast({
        title: "Error loading posts",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filters, user, toast]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadPosts(page + 1, false);
    }
  }, [loading, hasMore, page, loadPosts]);

  const refresh = useCallback(() => {
    loadPosts(0, true);
  }, [loadPosts]);

  const handleLike = useCallback(async (postId: string) => {
    if (!user) return;

    try {
      // Optimistic update
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          const isLiked = !post.is_liked;
          return {
            ...post,
            is_liked: isLiked,
            likes_count: isLiked ? post.likes_count + 1 : post.likes_count - 1
          };
        }
        return post;
      }));

      const result = await optimizedPostsService.toggleLike(postId);
      
      // Update with actual result
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            is_liked: result.isLiked,
            likes_count: result.newCount
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert optimistic update
      refresh();
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      });
    }
  }, [user, refresh, toast]);

  const handleCreatePost = useCallback(async (postData: {
    content: string;
    title?: string;
    post_type: 'text' | 'image' | 'video' | 'poll';
    visibility: 'public' | 'friends' | 'private';
    tags?: string[];
    image_url?: string;
  }) => {
    try {
      const newPost = await optimizedPostsService.createPost(postData);
      setPosts(prev => [newPost, ...prev]);
      toast({
        title: "Post created!",
        description: "Your post has been shared successfully."
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error creating post",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    loadPosts(0, true);
  }, [loadPosts]);

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    handleLike,
    handleCreatePost
  };
};
