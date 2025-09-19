
import { supabase } from '@/integrations/supabase/client';

export interface Community {
  id: string;
  name: string;
  description: string;
  category?: string;
  memberCount: number;
  isJoined: boolean;
  avatar_url?: string;
  is_private: boolean;
  created_by: string;
  created_at: string;
}

class CommunitiesService {
  async getCommunities(category?: string): Promise<Community[]> {
    try {
      let query = supabase
        .from('communities')
        .select('*');

      if (category) {
        query = query.eq('category', category);
      }

      const { data: communitiesData, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching communities:', error);
        throw error;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Get membership status for each community
      const communitiesWithMembership = await Promise.all(
        (communitiesData || []).map(async (community) => {
          let isJoined = false;
          
          if (userId) {
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
            memberCount: community.member_count || 0,
            isJoined
          } as Community;
        })
      );

      return communitiesWithMembership;
    } catch (error) {
      console.error('Error in getCommunities:', error);
      throw error;
    }
  }

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

      if (error) {
        console.error('Error joining community:', error);
        throw error;
      }

      // Update member count manually
      const { data: community } = await supabase
        .from('communities')
        .select('member_count')
        .eq('id', communityId)
        .single();

      if (community) {
        const { error: updateError } = await supabase
          .from('communities')
          .update({ member_count: (community.member_count || 0) + 1 })
          .eq('id', communityId);

        if (updateError) {
          console.warn('Error updating member count:', updateError);
        }
      }
    } catch (error) {
      console.error('Error in joinCommunity:', error);
      throw error;
    }
  }

  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    try {
      // Leave the community
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error leaving community:', error);
        throw error;
      }

      // Update member count manually
      const { data: community } = await supabase
        .from('communities')
        .select('member_count')
        .eq('id', communityId)
        .single();

      if (community) {
        const { error: updateError } = await supabase
          .from('communities')
          .update({ member_count: Math.max(0, (community.member_count || 0) - 1) })
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

  async createCommunity(communityData: {
    name: string;
    description: string;
    category?: string;
    is_private?: boolean;
  }, userId: string): Promise<Community> {
    try {
      const { data, error } = await supabase
        .from('communities')
        .insert({
          ...communityData,
          created_by: userId,
          member_count: 1
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating community:', error);
        throw error;
      }

      // Auto-join the creator
      await this.joinCommunity(data.id, userId);

      return {
        ...data,
        memberCount: 1,
        isJoined: true
      } as Community;
    } catch (error) {
      console.error('Error in createCommunity:', error);
      throw error;
    }
  }
}

export const communitiesService = new CommunitiesService();
