
import { useState, useEffect, useCallback } from 'react';
import { useOptimizedPosts } from './useOptimizedPosts';
import { realtimeNotificationsService } from '@/services/realtimeNotificationsService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useRealtimePosts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { posts, loading, error, createPost, isCreating, retry } = useOptimizedPosts();
  const [realtimePosts, setRealtimePosts] = useState(posts);

  // Update realtime posts when base posts change
  useEffect(() => {
    setRealtimePosts(posts);
  }, [posts]);

  // Subscribe to feed updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = realtimeNotificationsService.subscribeToFeedUpdates((update) => {
      if (update.type === 'new_post') {
        // Add new post to the top of the feed
        const newPost = update.payload.new;
        setRealtimePosts(prev => {
          // Check if post already exists to avoid duplicates
          const exists = prev.some(p => p.id === newPost.id);
          if (exists) return prev;
          
          return [newPost, ...prev];
        });

        // Show toast for new posts from other users
        if (newPost.user_id !== user.id) {
          toast({
            title: "New post available",
            description: "A new post has been shared in your feed"
          });
        }
      } else if (update.type === 'post_update') {
        // Update existing post
        const updatedPost = update.payload.new;
        setRealtimePosts(prev => 
          prev.map(post => 
            post.id === updatedPost.id ? { ...post, ...updatedPost } : post
          )
        );
      }
    });

    return () => {
      realtimeNotificationsService.unsubscribe('feed-updates');
    };
  }, [user, toast]);

  // Subscribe to post-specific updates (reactions, comments)
  const subscribeToPostUpdates = useCallback((postId: string) => {
    return realtimeNotificationsService.subscribeToPostUpdates(postId, (update) => {
      if (update.type === 'reaction') {
        setRealtimePosts(prev =>
          prev.map(post => {
            if (post.id === postId) {
              // Update reaction counts based on the change
              const reactionType = update.payload.new?.reaction_type || update.payload.old?.reaction_type;
              const isInsert = update.payload.eventType === 'INSERT';
              const isDelete = update.payload.eventType === 'DELETE';
              
              const updatedReactions = { ...post.reactions };
              if (updatedReactions[reactionType]) {
                if (isInsert) {
                  updatedReactions[reactionType].count += 1;
                } else if (isDelete) {
                  updatedReactions[reactionType].count = Math.max(0, updatedReactions[reactionType].count - 1);
                }
              }
              
              return { ...post, reactions: updatedReactions };
            }
            return post;
          })
        );
      } else if (update.type === 'comment') {
        setRealtimePosts(prev =>
          prev.map(post => {
            if (post.id === postId) {
              const isInsert = update.payload.eventType === 'INSERT';
              const isDelete = update.payload.eventType === 'DELETE';
              
              let newCount = post.comments_count;
              if (isInsert) newCount += 1;
              else if (isDelete) newCount = Math.max(0, newCount - 1);
              
              return { ...post, comments_count: newCount };
            }
            return post;
          })
        );
      }
    });
  }, []);

  return {
    posts: realtimePosts,
    loading,
    error,
    createPost,
    isCreating,
    retry,
    subscribeToPostUpdates
  };
};
