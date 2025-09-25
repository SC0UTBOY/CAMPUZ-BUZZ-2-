
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserPost {
  id: string;
  title?: string;
  content: string;
  image_url?: string;
  post_type: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  visibility: string;
}

export const useUserPosts = (userId?: string) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('posts')
          .select(`
            id,
            title,
            content,
            image_url,
            post_type,
            likes_count,
            comments_count,
            created_at,
            visibility
          `)
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        setPosts(data || []);
      } catch (err) {
        console.error('Error fetching user posts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch posts');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [targetUserId]);

  return { posts, loading, error };
};
