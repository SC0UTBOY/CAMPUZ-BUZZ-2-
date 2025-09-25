
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PostProfile {
  display_name: string;
  avatar_url?: string;
  major?: string;
  year?: string;
}

interface FixedPost {
  id: string;
  user_id: string;
  title?: string;
  content: string;
  image_url?: string;
  post_type: string;
  tags?: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles?: PostProfile;
}

export const useFixedPosts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<FixedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    try {
      // First get posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      // Get unique user IDs from posts
      const userIds = [...new Set(postsData?.map(post => post.user_id) || [])];
      
      // Get profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, major, year')
        .in('user_id', userIds);

      if (profilesError) {
        console.warn('Could not load profiles:', profilesError);
      }

      // Create a map of user_id to profile
      const profileMap = new Map();
      profilesData?.forEach(profile => {
        profileMap.set(profile.user_id, profile);
      });

      // Transform the data to match our FixedPost interface
      const transformedPosts: FixedPost[] = (postsData || []).map((dbPost: any) => ({
        id: dbPost.id,
        user_id: dbPost.user_id,
        title: dbPost.title,
        content: dbPost.content,
        image_url: dbPost.image_url,
        post_type: dbPost.post_type,
        tags: dbPost.tags,
        likes_count: dbPost.likes_count || 0,
        comments_count: dbPost.comments_count || 0,
        created_at: dbPost.created_at,
        profiles: profileMap.get(dbPost.user_id) || {
          display_name: 'Anonymous User',
          avatar_url: undefined,
          major: undefined,
          year: undefined
        }
      }));
      
      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: "Error loading posts",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (postData: any) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: postData.content,
          title: postData.title,
          post_type: postData.type || 'text',
          tags: postData.tags,
          image_url: postData.image
        })
        .select()
        .single();

      if (error) throw error;

      // Get the user's profile for the new post
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, major, year')
        .eq('user_id', user.id)
        .single();

      const newPost: FixedPost = {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        content: data.content,
        image_url: data.image_url,
        post_type: data.post_type,
        tags: data.tags,
        likes_count: data.likes_count || 0,
        comments_count: data.comments_count || 0,
        created_at: data.created_at,
        profiles: profileData || {
          display_name: 'Anonymous User'
        }
      };

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
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;

    try {
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
          .eq('post_id', postId)
          .eq('user_id', user.id);

        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes_count: post.likes_count - 1 }
            : post
        ));
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes_count: post.likes_count + 1 }
            : post
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return {
    posts,
    loading,
    handleCreatePost,
    handleLikePost
  };
};

export type { FixedPost, PostProfile };
