
import { supabase } from '@/integrations/supabase/client';
import { realtimeNotificationsService } from './realtimeNotificationsService';

export interface EnhancedCommunity {
  id: string;
  name: string;
  description: string;
  category?: string;
  avatar_url?: string;
  banner_url?: string;
  is_private: boolean;
  member_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  invite_code?: string;
  welcome_message?: string;
  rules?: string;
  isJoined: boolean;
}

export interface CommunityCreateData {
  name: string;
  description: string;
  category?: string;
  is_private?: boolean;
  welcome_message?: string;
  rules?: string;
  avatar_url?: string;
  banner_url?: string;
}

class EnhancedCommunitiesService {
  // Get communities with real-time member count
  async getCommunities(category?: string): Promise<EnhancedCommunity[]> {
    try {
      let query = supabase
        .from('communities')
        .select('*');

      if (category) {
        query = query.eq('category', category);
      }

      const { data: communitiesData, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Get membership status for each community
      const communitiesWithMembership = await Promise.all(
        (communitiesData || []).map(async (community) => {
          let isJoined = false;
          
          if (userId) {
            // Check membership using community_members table
            const { data: membership } = await supabase
              .from('community_members')
              .select('id')
              .eq('community_id', community.id)
              .eq('user_id', userId)
              .single();
            
            isJoined = !!membership;
          }

          return {
            ...community,
            category: undefined, // Not available in current schema
            isJoined
          } as EnhancedCommunity;
        })
      );

      return communitiesWithMembership;
    } catch (error) {
      console.error('Error in getCommunities:', error);
      throw error;
    }
  }

  // Create community with enhanced features
  async createCommunity(communityData: CommunityCreateData): Promise<EnhancedCommunity> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('communities')
        .insert({
          name: communityData.name,
          description: communityData.description,
          is_private: communityData.is_private || false,
          welcome_message: communityData.welcome_message,
          rules: communityData.rules,
          avatar_url: communityData.avatar_url,
          banner_url: communityData.banner_url,
          created_by: user.id,
          member_count: 1
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join the creator
      await this.joinCommunity(data.id, user.id);

      // Create notification for community creation
      await realtimeNotificationsService.createNotification(
        user.id,
        'community',
        'Community Created',
        `Your community "${data.name}" has been created successfully!`,
        { community_id: data.id }
      );

      return {
        ...data,
        category: undefined, // Not available in current schema
        isJoined: true
      } as EnhancedCommunity;
    } catch (error) {
      console.error('Error in createCommunity:', error);
      throw error;
    }
  }

  // Join community
  async joinCommunity(communityId: string, userId: string): Promise<void> {
    try {
      // Check if already a member
      const { data: existingMember } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        throw new Error('Already a member of this community');
      }

      // Join the community
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: userId
        });

      if (error) throw error;

      // Get current member count and increment it
      const { data: community } = await supabase
        .from('communities')
        .select('member_count')
        .eq('id', communityId)
        .single();

      if (community) {
        const { error: updateError } = await supabase
          .from('communities')
          .update({ member_count: community.member_count + 1 })
          .eq('id', communityId);

        if (updateError) {
          console.warn('Error updating member count:', updateError);
        }
      }

      // Notify community owner
      const { data: communityDetails } = await supabase
        .from('communities')
        .select('name, created_by')
        .eq('id', communityId)
        .single();

      if (communityDetails && communityDetails.created_by !== userId) {
        await realtimeNotificationsService.createNotification(
          communityDetails.created_by,
          'community',
          'New Member',
          `Someone joined your community "${communityDetails.name}"`,
          { community_id: communityId }
        );
      }
    } catch (error) {
      console.error('Error in joinCommunity:', error);
      throw error;
    }
  }

  // Leave community
  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', userId);

      if (error) throw error;

      // Get current member count and decrement it
      const { data: community } = await supabase
        .from('communities')
        .select('member_count')
        .eq('id', communityId)
        .single();

      if (community) {
        const { error: updateError } = await supabase
          .from('communities')
          .update({ member_count: Math.max(community.member_count - 1, 0) })
          .eq('id', communityId);

        if (updateError) {
          console.warn('Error updating member count:', updateError);
        }
      }
    } catch (error) {
      console.error('Error in leaveCommunity:', error);
      throw error;
    }
  }

  // Get community by invite code
  async getCommunityByInviteCode(inviteCode: string): Promise<EnhancedCommunity | null> {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .ilike('name', `%${inviteCode}%`)
        .single();

      if (error) throw error;

      return {
        ...data,
        category: undefined, // Not available in current schema
        isJoined: false
      } as EnhancedCommunity;
    } catch (error) {
      console.error('Error getting community by invite code:', error);
      return null;
    }
  }
}

export const enhancedCommunitiesService = new EnhancedCommunitiesService();
