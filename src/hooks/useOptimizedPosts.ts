
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { EnhancedPostData } from '@/types/posts';
import { safeParseReactions } from '@/services/posts/postTransformers';

export interface OptimizedPost extends EnhancedPostData {
  is_liked: boolean;
  is_saved: boolean;
  user_reaction?: string;
}

export const useOptimizedPosts = () => {
  const [posts, setPosts] = useState<OptimizedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            user_id,
            display_name,
            avatar_url,
            major,
            year
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const optimizedPosts: OptimizedPost[] = (data || []).map(post => ({
        ...post,
        post_type: post.post_type as 'text' | 'image' | 'video' | 'poll',
        visibility: post.visibility as 'public' | 'friends' | 'private',
        author: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles || {
          id: post.user_id,
          user_id: post.user_id,
          display_name: 'Anonymous User',
          avatar_url: undefined,
          major: undefined,
          year: undefined
        },
        is_liked: false,
        is_saved: false,
        user_reaction: undefined,
        reactions: safeParseReactions(post.reactions),
        hashtags: [],
        mentions: [],
        tags: post.tags || [],
        profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles || {
          id: post.user_id,
          user_id: post.user_id,
          display_name: 'Anonymous User',
          avatar_url: undefined,
          major: undefined,
          year: undefined
        }
      }));

      setPosts(optimizedPosts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData: any) => {
    try {
      setIsCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: postData.content,
          title: postData.title,
          post_type: postData.post_type,
          visibility: postData.visibility,
          tags: postData.tags || [],
          image_url: postData.image_url,
          reactions: {}
        })
        .select(`
          *,
          profiles:user_id (
            id,
            user_id,
            display_name,
            avatar_url,
            major,
            year
          )
        `)
        .single();

      if (error) throw error;

      const newPost: OptimizedPost = {
        ...data,
        post_type: data.post_type as 'text' | 'image' | 'video' | 'poll',
        visibility: data.visibility as 'public' | 'friends' | 'private',
        author: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles || {
          id: data.user_id,
          user_id: data.user_id,
          display_name: 'Anonymous User',
          avatar_url: undefined,
          major: undefined,
          year: undefined
        },
        is_liked: false,
        is_saved: false,
        user_reaction: undefined,
        reactions: safeParseReactions(data.reactions),
        hashtags: [],
        mentions: [],
        tags: data.tags || [],
        profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles || {
          id: data.user_id,
          user_id: data.user_id,
          display_name: 'Anonymous User',
          avatar_url: undefined,
          major: undefined,
          year: undefined
        }
      };

      setPosts(prev => [newPost, ...prev]);
      return newPost;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  const retry = () => {
    setError(null);
    loadPosts();
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return { posts, loading, error, refetch: loadPosts, createPost, isCreating, retry };
};
