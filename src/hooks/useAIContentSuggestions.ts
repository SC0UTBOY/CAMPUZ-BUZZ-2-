
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ContentSuggestion {
  id: string;
  type: 'post' | 'community' | 'event' | 'study_group';
  title: string;
  description: string;
  relevance_score: number;
  metadata?: any;
  created_at: string;
}

export const useAIContentSuggestions = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const generateSuggestions = async () => {
    if (!user?.id) return;

    try {
      // Get user's interests and activity
      const { data: profile } = await supabase
        .from('profiles')
        .select('interests, major, skills')
        .eq('user_id', user.id)
        .single();

      const { data: recentPosts } = await supabase
        .from('posts')
        .select('tags, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: userCommunities } = await supabase
        .from('community_members')
        .select(`
          communities (
            id,
            name,
            category
          )
        `)
        .eq('user_id', user.id);

      // Simple AI-like content matching
      const userInterests = [
        ...(profile?.interests || []),
        ...(profile?.skills || []),
        profile?.major
      ].filter(Boolean);

      const postTags = recentPosts?.flatMap(p => p.tags || []) || [];
      const communityCategories = userCommunities
        ?.map(uc => (uc.communities as any)?.category)
        .filter(Boolean) || [];

      // Generate suggestions based on interests
      const suggestions: ContentSuggestion[] = [];

      // Suggest trending posts in user's interests
      const { data: trendingPosts } = await supabase
        .from('posts')
        .select(`
          id, 
          title, 
          content, 
          tags, 
          user_id, 
          profiles!inner (display_name)
        `)
        .not('user_id', 'eq', user.id)
        .order('likes_count', { ascending: false })
        .limit(10);

      trendingPosts?.forEach(post => {
        const matchingTags = (post.tags || []).filter(tag => 
          userInterests.some(interest => 
            interest?.toLowerCase().includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes(interest?.toLowerCase())
          )
        );

        if (matchingTags.length > 0) {
          suggestions.push({
            id: `post-${post.id}`,
            type: 'post',
            title: `Popular post: ${post.title || 'Untitled'}`,
            description: `By ${(post.profiles as any)?.display_name} - ${matchingTags.join(', ')}`,
            relevance_score: Math.min(95, 60 + matchingTags.length * 10),
            metadata: { post_id: post.id, tags: matchingTags },
            created_at: new Date().toISOString()
          });
        }
      });

      // Suggest communities based on interests
      const { data: recommendedCommunities } = await supabase
        .from('communities')
        .select('id, name, description, category, member_count')
        .not('id', 'in', userCommunities?.map(uc => (uc.communities as any)?.id).filter(Boolean) || [])
        .limit(5);

      recommendedCommunities?.forEach(community => {
        const relevanceScore = userInterests.some(interest =>
          community.name.toLowerCase().includes(interest?.toLowerCase()) ||
          community.description?.toLowerCase().includes(interest?.toLowerCase()) ||
          community.category?.toLowerCase() === interest?.toLowerCase()
        ) ? 85 : 50;

        if (relevanceScore >= 70) {
          suggestions.push({
            id: `community-${community.id}`,
            type: 'community',
            title: `Join ${community.name}`,
            description: community.description || `${community.member_count} members`,
            relevance_score: relevanceScore,
            metadata: { community_id: community.id },
            created_at: new Date().toISOString()
          });
        }
      });

      // Suggest study groups
      const { data: studyGroups } = await supabase
        .from('study_groups')
        .select('id, name, description, subject')
        .eq('is_private', false)
        .limit(5);

      studyGroups?.forEach(group => {
        const relevanceScore = userInterests.some(interest =>
          group.subject.toLowerCase().includes(interest?.toLowerCase()) ||
          group.name.toLowerCase().includes(interest?.toLowerCase())
        ) ? 80 : 45;

        if (relevanceScore >= 60) {
          suggestions.push({
            id: `study-group-${group.id}`,
            type: 'study_group',
            title: `Join study group: ${group.name}`,
            description: `${group.subject} - ${group.description || 'Study together'}`,
            relevance_score: relevanceScore,
            metadata: { study_group_id: group.id },
            created_at: new Date().toISOString()
          });
        }
      });

      // Sort by relevance score
      suggestions.sort((a, b) => b.relevance_score - a.relevance_score);
      setSuggestions(suggestions.slice(0, 8)); // Limit to top 8 suggestions

    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  useEffect(() => {
    generateSuggestions();
  }, [user?.id]);

  return {
    suggestions,
    loading,
    dismissSuggestion,
    refreshSuggestions: generateSuggestions
  };
};
