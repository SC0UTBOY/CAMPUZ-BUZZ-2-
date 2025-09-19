
import { supabase } from '@/integrations/supabase/client';
import { OptimizedUserProfile } from '@/hooks/useOptimizedProfile';

class DatabaseService {
  // Profile operations
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

  async toggleSave(postId: string, userId: string): Promise<void> {
    try {
      const { data: existingSave } = await supabase
        .from('post_saves')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (existingSave) {
        // Unsave
        await supabase
          .from('post_saves')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
      } else {
        // Save
        await supabase
          .from('post_saves')
          .insert({
            post_id: postId,
            user_id: userId
          });
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      throw error;
    }
  }

  // Communities operations
  async getCommunities(category?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching communities:', error);
      throw error;
    }
  }

  async joinCommunity(communityId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: userId
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error joining community:', error);
      throw error;
    }
  }

  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error leaving community:', error);
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

  private convertJsonToRecord(json: any): Record<string, any> | null {
    if (!json) return null;
    if (typeof json === 'object' && json !== null) {
      return json as Record<string, any>;
    }
    return null;
  }
}

export const databaseService = new DatabaseService();
