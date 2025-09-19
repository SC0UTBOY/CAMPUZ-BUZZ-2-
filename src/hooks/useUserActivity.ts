
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ActivityItem {
  id: string;
  type: 'post' | 'comment' | 'community_join' | 'event_rsvp';
  title: string;
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export const useUserActivity = (userId?: string) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    const fetchUserActivity = async () => {
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch recent posts
        const { data: posts } = await supabase
          .from('posts')
          .select('id, title, content, created_at, post_type')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(10);

        // Fetch recent comments with proper join
        const { data: comments } = await supabase
          .from('comments')
          .select(`
            id, content, created_at,
            posts!inner (title, content)
          `)
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(10);

        // Fetch recent community joins
        const { data: communityJoins } = await supabase
          .from('community_members')
          .select(`
            id, joined_at,
            communities!inner (name)
          `)
          .eq('user_id', targetUserId)
          .order('joined_at', { ascending: false })
          .limit(5);

        // Fetch recent event RSVPs
        const { data: eventRsvps } = await supabase
          .from('event_rsvps')
          .select(`
            id, created_at, status,
            events!inner (title)
          `)
          .eq('user_id', targetUserId)
          .eq('status', 'going')
          .order('created_at', { ascending: false })
          .limit(5);

        // Transform and combine all activities
        const allActivities: ActivityItem[] = [];

        // Add posts
        (posts || []).forEach(post => {
          allActivities.push({
            id: `post-${post.id}`,
            type: 'post',
            title: 'Created a post',
            description: post.title || post.content?.substring(0, 100) + '...' || 'No content',
            created_at: post.created_at,
            metadata: { post_type: post.post_type }
          });
        });

        // Add comments
        (comments || []).forEach(comment => {
          const postData = Array.isArray(comment.posts) ? comment.posts[0] : comment.posts;
          allActivities.push({
            id: `comment-${comment.id}`,
            type: 'comment',
            title: 'Commented on a post',
            description: comment.content?.substring(0, 100) + '...' || 'No content',
            created_at: comment.created_at,
            metadata: { 
              post_title: postData?.title || postData?.content?.substring(0, 50) || 'Unknown post'
            }
          });
        });

        // Add community joins
        (communityJoins || []).forEach(join => {
          const communityData = Array.isArray(join.communities) ? join.communities[0] : join.communities;
          if (communityData) {
            allActivities.push({
              id: `community-${join.id}`,
              type: 'community_join',
              title: 'Joined a community',
              description: `Joined ${communityData.name}`,
              created_at: join.joined_at,
              metadata: { community_name: communityData.name }
            });
          }
        });

        // Add event RSVPs
        (eventRsvps || []).forEach(rsvp => {
          const eventData = Array.isArray(rsvp.events) ? rsvp.events[0] : rsvp.events;
          if (eventData) {
            allActivities.push({
              id: `event-${rsvp.id}`,
              type: 'event_rsvp',
              title: 'RSVP\'d to an event',
              description: `Going to ${eventData.title}`,
              created_at: rsvp.created_at,
              metadata: { event_title: eventData.title }
            });
          }
        });

        // Sort by date and limit
        const sortedActivities = allActivities
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 20);

        setActivities(sortedActivities);
      } catch (err) {
        console.error('Error fetching user activity:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch activity');
      } finally {
        setLoading(false);
      }
    };

    fetchUserActivity();
  }, [targetUserId]);

  return { activities, loading, error };
};
