
import { supabase } from '@/integrations/supabase/client';

export interface Community {
  id: string;
  name: string;
  description: string;
  category?: string;
  is_private: boolean;
  member_count: number;
  memberCount: number;
  isJoined: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

class CommunitiesService {
  async getCommunities(category?: string): Promise<Community[]> {
    try {
      // Select actual schema columns
      let query = supabase
        .from('communities')
        .select('id, name, description, category, is_private, member_count, created_by, created_at, updated_at');

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
              .maybeSingle();
            
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

  async joinCommunity(communityId: string, userId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(communityId)) {
        console.error('❌ Invalid community ID format:', communityId);
        throw new Error('Invalid community ID');
      }
      if (!uuidRegex.test(userId)) {
        console.error('❌ Invalid user ID format:', userId);
        throw new Error('Invalid user ID');
      }

      console.log('🔵 JOIN DEBUG - Community ID:', communityId);
      console.log('🔵 JOIN DEBUG - User ID:', userId);


      // Check if already a member using maybeSingle to avoid errors
      const { data: existingMember, error: checkError } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Membership check error:', checkError);
        return { success: false, error: 'Could not check membership.' };
      }

      if (existingMember) {
        console.log('ℹ️ Already a member');
        return { success: true, message: 'Already joined.' };
      }

      // Join the community - roles is uuid[], NOT string[]
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: userId,
          joined_at: new Date().toISOString(),
          roles: [], // Empty array - roles are uuid references
          banned: false
        });

      if (error) {
        console.error('❌ JOIN ERROR:', error);
        console.error('JOIN ERROR DETAILS:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          communityId: communityId,
          userId: userId
        });
        return { success: false, error: `Failed to join community: ${error.message}` };
      }

      // Update member count
      const { data: communityData } = await supabase
        .from('communities')
        .select('member_count')
        .eq('id', communityId)
        .single();

      if (communityData) {
        await supabase
          .from('communities')
          .update({ member_count: (communityData.member_count || 0) + 1 })
          .eq('id', communityId);
      }

      return { success: true, message: 'Successfully joined community!' };
    } catch (error: any) {
      console.error('joinCommunity() Error:', error.message);
      return { success: false, error: error.message };
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

      // Update member count
      const { data: communityData } = await supabase
        .from('communities')
        .select('member_count')
        .eq('id', communityId)
        .single();

      if (communityData) {
        await supabase
          .from('communities')
          .update({ member_count: Math.max(0, (communityData.member_count || 0) - 1) })
          .eq('id', communityId);
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
          name: communityData.name,
          description: communityData.description,
          category: communityData.category,
          is_private: communityData.is_private || false,
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
        memberCount: data.member_count || 1,
        isJoined: true
      } as Community;
    } catch (error) {
      console.error('Error in createCommunity:', error);
      throw error;
    }
  }
}

export const communitiesService = new CommunitiesService();
