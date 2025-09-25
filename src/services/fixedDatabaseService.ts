import { supabase } from '@/integrations/supabase/client';
import { OptimizedUserProfile } from '@/hooks/useOptimizedProfile';

interface FixedPostData {
  id: string;
  user_id: string;
  title?: string;
  content: string;
  image_url?: string;
  post_type: 'text' | 'image' | 'video' | 'poll';
  tags?: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  created_at: string;
  updated_at: string;
  visibility: 'public' | 'friends' | 'private';
  author: {
    id: string;
    display_name: string;
    avatar_url?: string;
    major?: string;
    year?: string;
  };
}

class FixedDatabaseService {
  // Profile operations remain the same as they work correctly
  async getProfile(userId: string): Promise<OptimizedUserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Profile doesn't exist
        }
        throw error;
      }

      return this.transformProfileData(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  async createProfile(userId: string, userData: any): Promise<OptimizedUserProfile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          display_name: userData.display_name || 'New User',
          role: 'student',
          engagement_score: 0,
          privacy_settings: {
            email_visible: false,
            profile_visible: true,
            academic_info_visible: true,
            notifications: {
              posts: true,
              comments: true,
              mentions: true,
              messages: true,
              events: true
            }
          },
          ...userData
        })
        .select()
        .single();

      if (error) throw error;
      return this.transformProfileData(data);
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, updates: Partial<OptimizedUserProfile>): Promise<OptimizedUserProfile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return this.transformProfileData(data);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Fixed post operations that don't rely on problematic joins
  async getPosts(limit: number = 20): Promise<FixedPostData[]> {
    try {
      // Get posts first
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(postsData.map(post => post.user_id))];
      
      // Get profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, major, year')
        .in('user_id', userIds);

      if (profilesError) {
        console.warn('Could not load profiles:', profilesError);
      }

      // Create profile lookup map
      const profileMap = new Map();
      profilesData?.forEach(profile => {
        profileMap.set(profile.user_id, profile);
      });

      // Transform posts with profile data
      return postsData.map(post => this.transformFixedPostData(post, profileMap));
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  async createPost(userId: string, postData: any): Promise<FixedPostData> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content: postData.content,
          title: postData.title,
          post_type: postData.post_type || 'text',
          tags: postData.tags || [],
          image_url: postData.image_url,
          visibility: postData.visibility || 'public'
        })
        .select()
        .single();

      if (error) throw error;

      // Get the author's profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, major, year')
        .eq('user_id', userId)
        .single();

      const profileMap = new Map();
      if (profileData) {
        profileMap.set(profileData.user_id, profileData);
      }

      return this.transformFixedPostData(data, profileMap);
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  async toggleLike(postId: string, userId: string): Promise<void> {
    try {
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
      } else {
        // Like
        await supabase
          .from('likes')  
          .insert({
            post_id: postId,
            user_id: userId
          });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  // Helper methods
  private transformProfileData(data: any): OptimizedUserProfile {
    return {
      ...data,
      social_links: this.convertJsonToRecord(data.social_links),
      privacy_settings: this.convertJsonToRecord(data.privacy_settings)
    } as OptimizedUserProfile;
  }

  private transformFixedPostData(data: any, profileMap: Map<string, any>): FixedPostData {
    const profile = profileMap.get(data.user_id);
    
    return {
      ...data,
      post_type: (data.post_type as 'text' | 'image' | 'video' | 'poll') || 'text',
      updated_at: data.updated_at || data.created_at,
      visibility: (data.visibility as 'public' | 'friends' | 'private') || 'public',
      author: {
        id: data.user_id,
        display_name: profile?.display_name || 'Anonymous User',
        avatar_url: profile?.avatar_url,
        major: profile?.major,
        year: profile?.year
      },
      likes_count: data.likes_count || 0,
      comments_count: data.comments_count || 0,
      shares_count: data.shares_count || 0,
      saves_count: data.saves_count || 0,
    };
  }

  private convertJsonToRecord(json: any): Record<string, any> | null {
    if (!json) return null;
    if (typeof json === 'object' && json !== null) {
      return json as Record<string, any>;
    }
    return null;
  }
}

export const fixedDatabaseService = new FixedDatabaseService();
