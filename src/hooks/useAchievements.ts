
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Achievement {
  id: string;
  achievement_type: string;
  achievement_data: {
    title: string;
    description: string;
    icon: string;
    color: string;
    requirement: number;
    current?: number;
  };
  earned_at?: string;
  is_visible: boolean;
}

const ACHIEVEMENT_DEFINITIONS = [
  {
    type: 'first_post',
    title: 'First Steps',
    description: 'Created your first post',
    icon: '📝',
    color: 'bg-blue-500',
    requirement: 1
  },
  {
    type: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Made 10 posts',
    icon: '🦋',
    color: 'bg-purple-500',
    requirement: 10
  },
  {
    type: 'community_builder',
    title: 'Community Builder',
    description: 'Joined 5 communities',
    icon: '🏘️',
    color: 'bg-green-500',
    requirement: 5
  },
  {
    type: 'study_buddy',
    title: 'Study Buddy',
    description: 'Joined 3 study groups',
    icon: '📚',
    color: 'bg-orange-500',
    requirement: 3
  },
  {
    type: 'helpful_mentor',
    title: 'Helpful Mentor',
    description: 'Helped 5 students as a mentor',
    icon: '🎓',
    color: 'bg-yellow-500',
    requirement: 5
  },
  {
    type: 'event_enthusiast',
    title: 'Event Enthusiast',
    description: 'Attended 10 events',
    icon: '🎉',
    color: 'bg-pink-500',
    requirement: 10
  }
];

export const useAchievements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const checkAndAwardAchievements = async () => {
    if (!user?.id) return;

    try {
      // Get user stats
      const [postsCount, communitiesCount, studyGroupsCount, eventsCount] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('community_members').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('study_group_members').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('event_rsvps').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'going')
      ]);

      const stats = {
        posts: postsCount.count || 0,
        communities: communitiesCount.count || 0,
        study_groups: studyGroupsCount.count || 0,
        events: eventsCount.count || 0
      };

      // Check each achievement
      for (const def of ACHIEVEMENT_DEFINITIONS) {
        let currentValue = 0;
        
        switch (def.type) {
          case 'first_post':
          case 'social_butterfly':
            currentValue = stats.posts;
            break;
          case 'community_builder':
            currentValue = stats.communities;
            break;
          case 'study_buddy':
            currentValue = stats.study_groups;
            break;
          case 'event_enthusiast':
            currentValue = stats.events;
            break;
        }

        if (currentValue >= def.requirement) {
          // Check if already earned
          const { data: existing } = await supabase
            .from('user_achievements')
            .select('id')
            .eq('user_id', user.id)
            .eq('achievement_type', def.type)
            .single();

          if (!existing) {
            // Award achievement
            await supabase.from('user_achievements').insert({
              user_id: user.id,
              achievement_type: def.type,
              achievement_data: {
                ...def,
                current: currentValue
              }
            });

            toast({
              title: "🎉 Achievement Unlocked!",
              description: `${def.title}: ${def.description}`
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const loadAchievements = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedAchievements: Achievement[] = (data || []).map(item => ({
        id: item.id,
        achievement_type: item.achievement_type,
        achievement_data: item.achievement_data as Achievement['achievement_data'],
        earned_at: item.earned_at || undefined,
        is_visible: item.is_visible ?? true
      }));

      setAchievements(transformedAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const getProgressTowards = (achievementType: string) => {
    // This would calculate progress towards unearned achievements
    // Implementation depends on your specific requirements
    return { current: 0, required: 1, percentage: 0 };
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadAchievements(),
        checkAndAwardAchievements()
      ]);
      setLoading(false);
    };

    loadData();
  }, [user?.id]);

  return {
    achievements,
    loading,
    checkAndAwardAchievements,
    getProgressTowards,
    refetch: loadAchievements
  };
};
