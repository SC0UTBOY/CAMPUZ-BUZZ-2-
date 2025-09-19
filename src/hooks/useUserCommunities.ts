
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserCommunity {
  id: string;
  name: string;
  description?: string;
  category?: string;
  member_count: number;
  is_private: boolean;
  joined_at: string;
}

export const useUserCommunities = (userId?: string) => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<UserCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    const fetchUserCommunities = async () => {
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('community_members')
          .select(`
            joined_at,
            communities!inner (
              id,
              name,
              description,
              category,
              member_count,
              is_private
            )
          `)
          .eq('user_id', targetUserId)
          .order('joined_at', { ascending: false });

        if (error) throw error;

        const transformedData = (data || [])
          .filter(item => item.communities)
          .map(item => {
            const community = Array.isArray(item.communities) ? item.communities[0] : item.communities;
            return {
              id: community.id,
              name: community.name,
              description: community.description,
              category: community.category,
              member_count: community.member_count,
              is_private: community.is_private,
              joined_at: item.joined_at
            };
          }) as UserCommunity[];

        setCommunities(transformedData);
      } catch (err) {
        console.error('Error fetching user communities:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch communities');
      } finally {
        setLoading(false);
      }
    };

    fetchUserCommunities();
  }, [targetUserId]);

  return { communities, loading, error };
};
