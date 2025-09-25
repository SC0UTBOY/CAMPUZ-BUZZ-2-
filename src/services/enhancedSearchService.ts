
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'community' | 'event';
  title: string;
  description?: string;
  imageUrl?: string;
  metadata?: any;
}

export interface TrendingTopic {
  id: string;
  topic: string;
  mention_count: number;
  trend_score: number;
}

class EnhancedSearchService {
  // Universal search across all content types
  async search(query: string, filters?: {
    type?: 'user' | 'post' | 'community' | 'event';
    limit?: number;
  }): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const limit = filters?.limit || 10;

    try {
      // Search users (profiles)
      if (!filters?.type || filters.type === 'user') {
        const { data: users } = await supabase
          .from('profiles')
          .select('user_id, display_name, bio, avatar_url')
          .or(`display_name.ilike.%${query}%,bio.ilike.%${query}%`)
          .limit(limit);

        if (users) {
          results.push(...users.map(user => ({
            id: user.user_id,
            type: 'user' as const,
            title: user.display_name || 'Anonymous User',
            description: user.bio,
            imageUrl: user.avatar_url,
            metadata: user
          })));
        }
      }

      // Search posts with proper join
      if (!filters?.type || filters.type === 'post') {
        const { data: posts } = await supabase
          .from('posts')
          .select(`
            id,
            title,
            content,
            user_id,
            created_at,
            profiles!posts_user_id_fkey(display_name, avatar_url)
          `)
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
          .limit(limit);

        if (posts) {
          results.push(...posts.map(post => {
            // Safely access profile data
            const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
            return {
              id: post.id,
              type: 'post' as const,
              title: post.title || 'Untitled Post',
              description: post.content?.substring(0, 200) + '...',
              imageUrl: undefined,
              metadata: {
                ...post,
                author: profile?.display_name || 'Anonymous',
                authorAvatar: profile?.avatar_url
              }
            };
          }));
        }
      }

      // Search communities
      if (!filters?.type || filters.type === 'community') {
        const { data: communities } = await supabase
          .from('communities')
          .select('*')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(limit);

         if (communities) {
           results.push(...communities.map(community => ({
             id: community.id,
             type: 'community' as const,
             title: community.name,
             description: community.description,
             imageUrl: undefined, // avatar_url not available in communities table
             metadata: community
           })));
         }
      }

      // Search events
      if (!filters?.type || filters.type === 'event') {
        const { data: events } = await supabase
          .from('events')
          .select('*')
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(limit);

        if (events) {
          results.push(...events.map(event => ({
            id: event.id,
            type: 'event' as const,
            title: event.title,
            description: event.description,
            imageUrl: undefined, // events table doesn't have image_url field
            metadata: event
          })));
        }
      }

      return results.slice(0, limit);
    } catch (error) {
      console.error('Error in search:', error);
      return [];
    }
  }

  // Get trending topics
  async getTrendingTopics(limit: number = 10): Promise<TrendingTopic[]> {
    try {
      const { data, error } = await supabase
        .from('trending_topics')
        .select('*')
        .order('trend_score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting trending topics:', error);
      return [];
    }
  }

  // Get search suggestions based on user input
  async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!query || query.length < 2) return [];

    try {
      const suggestions: string[] = [];

      // Get user name suggestions
      const { data: users } = await supabase
        .from('profiles')
        .select('display_name')
        .ilike('display_name', `${query}%`)
        .limit(limit);

      if (users) {
        suggestions.push(...users.map(u => u.display_name).filter(Boolean));
      }

      // Get community name suggestions
      const { data: communities } = await supabase
        .from('communities')
        .select('name')
        .ilike('name', `${query}%`)
        .limit(limit);

      if (communities) {
        suggestions.push(...communities.map(c => c.name));
      }

      // Get trending topic suggestions
      const { data: topics } = await supabase
        .from('trending_topics')
        .select('topic')
        .ilike('topic', `${query}%`)
        .limit(limit);

      if (topics) {
        suggestions.push(...topics.map(t => t.topic));
      }

      return [...new Set(suggestions)].slice(0, limit);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  // Advanced search with multiple filters
  async advancedSearch(params: {
    query: string;
    type?: 'user' | 'post' | 'community' | 'event';
    dateRange?: { start: string; end: string };
    tags?: string[];
    author?: string;
    community?: string;
    limit?: number;
  }): Promise<SearchResult[]> {
    const { query, type, dateRange, tags, author, community, limit = 20 } = params;
    
    try {
      let results: SearchResult[] = [];

      if (type === 'post' || !type) {
        let postQuery = supabase
          .from('posts')
          .select(`
            id,
            title,
            content,
            created_at,
            tags,
            user_id,
            profiles!posts_user_id_fkey(display_name, avatar_url)
          `)
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`);

        if (dateRange) {
          postQuery = postQuery
            .gte('created_at', dateRange.start)
            .lte('created_at', dateRange.end);
        }

        if (tags && tags.length > 0) {
          postQuery = postQuery.overlaps('tags', tags);
        }

        if (author) {
          // We'll filter by author after getting the results since we need to join
        }

        const { data: posts } = await postQuery.limit(limit);

        if (posts) {
          results.push(...posts.map(post => {
            const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
            return {
              id: post.id,
              type: 'post' as const,
              title: post.title || 'Untitled Post',
              description: post.content?.substring(0, 200) + '...',
              imageUrl: undefined,
              metadata: {
                ...post,
                author: profile?.display_name || 'Anonymous',
                authorAvatar: profile?.avatar_url
              }
            };
          }).filter(post => !author || post.metadata.author === author));
        }
      }

      return results;
    } catch (error) {
      console.error('Error in advanced search:', error);
      return [];
    }
  }
}

export const enhancedSearchService = new EnhancedSearchService();
