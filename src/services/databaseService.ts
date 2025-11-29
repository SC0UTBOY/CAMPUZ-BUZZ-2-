import { supabase } from '@/integrations/supabase/client';
import { OptimizedUserProfile } from '@/hooks/useOptimizedProfile';

class DatabaseService {
  // Profile operations
  async getProfile(userId: string): Promise<OptimizedUserProfile | null> {
    try {
      // Check if we are fetching the current user's profile
      const { data: { user } } = await supabase.auth.getUser();

      if (user && user.id === userId) {
        // Return full profile from metadata for current user
        const metadata = user.user_metadata || {};
        return {
          id: user.id,
          user_id: user.id,
          display_name: metadata.display_name || metadata.full_name || user.email?.split('@')[0] || 'User',
          bio: metadata.bio,
          avatar_url: metadata.avatar_url,
          major: metadata.major,
          department: metadata.department,
          year: metadata.year,
          role: metadata.role || 'student',
          engagement_score: metadata.engagement_score || 0,
          school: metadata.school,
          gpa: metadata.gpa,
          graduation_year: metadata.graduation_year,
          skills: metadata.skills || [],
          interests: metadata.interests || [],
          social_links: this.convertJsonToRecord(metadata.social_links),
          privacy_settings: this.convertJsonToRecord(metadata.privacy_settings) || {
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
          created_at: user.created_at,
          updated_at: user.updated_at || new Date().toISOString(),
        } as OptimizedUserProfile;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
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
      // Update auth metadata since profiles is a view
      const { data: { user }, error } = await supabase.auth.updateUser({
        data: {
          display_name: userData.display_name || 'New User',
          ...userData
        }
      });

      if (error) throw error;
      if (!user) throw new Error('User not found');

      // Return the profile from the view
      return this.getProfile(userId) as Promise<OptimizedUserProfile>;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, updates: Partial<OptimizedUserProfile>): Promise<OptimizedUserProfile> {
    try {
      // Update auth metadata
      const { data: { user }, error } = await supabase.auth.updateUser({
        data: {
          ...updates,
          updated_at: new Date().toISOString()
        }
      });

      if (error) throw error;

      // Return the updated profile from the view
      return this.getProfile(userId) as Promise<OptimizedUserProfile>;
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
      // Select actual schema columns
      let query = supabase
        .from('communities')
        .select('id, name, description, category, is_private, member_count, created_by, created_at, updated_at')
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
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(communityId)) {
        console.error('Invalid community ID format:', communityId);
        throw new Error('Invalid community ID');
      }
      if (!uuidRegex.test(userId)) {
        console.error('Invalid user ID format:', userId);
        throw new Error('Invalid user ID');
      }

      // Debug logging
      console.log('JOIN DEBUG - Community ID:', communityId);
      console.log('JOIN DEBUG - User ID:', userId);
      console.log('JOIN PAYLOAD:', { communityId, userId });

      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: userId,
          joined_at: new Date().toISOString(),
          roles: [],
          banned: false
        });

      if (error) {
        console.error('JOIN ERROR:', error);
        console.error('JOIN ERROR DETAILS:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          communityId: communityId,
          userId: userId
        });
        throw error;
      }
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
