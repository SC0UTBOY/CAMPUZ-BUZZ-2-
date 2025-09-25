import { supabase } from '@/integrations/supabase/client';

export interface SearchFilters {
  type?: string[];
  dateRange?: 'all' | 'day' | 'week' | 'month' | 'year';
  sortBy?: 'relevance' | 'recent' | 'popular';
  location?: string;
  tags?: string[];
}

export interface SearchResult {
  id: string;
  type: 'post' | 'user' | 'community' | 'event';
  title: string;
  subtitle?: string;
  content: string;
  description?: string;
  avatar_url?: string;
  created_at: string;
  date?: string;
  location?: string;
  tags?: string[];
  likes_count?: number;
  comments_count?: number;
  member_count?: number;
  relevance_score?: number;
  author?: {
    display_name: string;
    avatar_url?: string;
  };
  metadata: any;
}

export class SearchService {
  static async search(query: string, filters: SearchFilters = {}, page = 1, limit = 20): Promise<{
    results: SearchResult[];
    total: number;
    suggestions: string[];
  }> {
    const results: SearchResult[] = [];
    let total = 0;
    const suggestions: string[] = [];

    try {
      // Search posts
      if (!filters.type || filters.type.length === 0 || filters.type.includes('posts')) {
        const { data: posts, count } = await this.searchPosts(query, filters, page, limit);
        results.push(...posts);
        total += count || 0;
      }

      // Search users
      if (!filters.type || filters.type.length === 0 || filters.type.includes('users')) {
        const { data: users, count } = await this.searchUsers(query, filters, page, limit);
        results.push(...users);
        total += count || 0;
      }

      // Search communities
      if (!filters.type || filters.type.length === 0 || filters.type.includes('communities')) {
        const { data: communities, count } = await this.searchCommunities(query, filters, page, limit);
        results.push(...communities);
        total += count || 0;
      }

      // Search events
      if (!filters.type || filters.type.length === 0 || filters.type.includes('events')) {
        const { data: events, count } = await this.searchEvents(query, filters, page, limit);
        results.push(...events);
        total += count || 0;
      }

      // Get search suggestions
      const searchSuggestions = await this.getSearchSuggestions(query);
      suggestions.push(...searchSuggestions);

      // Sort by relevance or date
      results.sort((a, b) => {
        if (filters.sortBy === 'recent') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return (b.relevance_score || 0) - (a.relevance_score || 0);
      });

      return { results, total, suggestions };
    } catch (error) {
      console.error('Search error:', error);
      return { results: [], total: 0, suggestions: [] };
    }
  }

  private static async searchPosts(query: string, filters: SearchFilters, page: number, limit: number) {
    let queryBuilder = supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        created_at,
        user_id,
        tags,
        likes_count,
        comments_count,
        profiles:user_id (
          display_name,
          avatar_url
        )
      `, { count: 'exact' })
      .textSearch('search_vector', query, { type: 'websearch' });

    // Apply filters
    if (filters.dateRange && filters.dateRange !== 'all') {
      const date = this.getDateFilter(filters.dateRange);
      queryBuilder = queryBuilder.gte('created_at', date);
    }

    if (filters.tags && filters.tags.length > 0) {
      queryBuilder = queryBuilder.overlaps('tags', filters.tags);
    }

    const { data, error, count } = await queryBuilder
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    const results: SearchResult[] = (data || []).map(post => ({
      id: post.id,
      type: 'post' as const,
      title: post.title || post.content.substring(0, 100) + '...',
      content: post.content,
      description: post.content,
      avatar_url: (post.profiles as any)?.avatar_url,
      created_at: post.created_at,
      tags: post.tags,
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      relevance_score: 1,
      author: {
        display_name: (post.profiles as any)?.display_name || 'Anonymous',
        avatar_url: (post.profiles as any)?.avatar_url
      },
      metadata: {
        author: (post.profiles as any)?.display_name,
        likes: post.likes_count,
        comments: post.comments_count,
        tags: post.tags
      }
    }));

    return { data: results, count };
  }

  private static async searchUsers(query: string, filters: SearchFilters, page: number, limit: number) {
    let queryBuilder = supabase
      .from('profiles')
      .select(`
        user_id,
        display_name,
        bio,
        avatar_url,
        major,
        school,
        year,
        skills,
        interests,
        created_at
      `, { count: 'exact' })
      .textSearch('search_vector', query, { type: 'websearch' });

    const { data, error, count } = await queryBuilder
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    const results: SearchResult[] = (data || []).map(profile => ({
      id: profile.user_id,
      type: 'user' as const,
      title: profile.display_name || 'Anonymous User',
      subtitle: `${profile.major || ''} ${profile.year ? `• ${profile.year}` : ''}`.trim(),
      content: profile.bio || '',
      description: profile.bio || '',
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      relevance_score: 1,
      metadata: {
        major: profile.major,
        school: profile.school,
        year: profile.year,
        skills: profile.skills,
        interests: profile.interests
      }
    }));

    return { data: results, count };
  }

  private static async searchCommunities(query: string, filters: SearchFilters, page: number, limit: number) {
    let queryBuilder = supabase
      .from('communities')
      .select(`
        id,
        name,
        description,
        category,
        member_count,
        is_private,
        created_at
      `, { count: 'exact' })
      .textSearch('search_vector', query, { type: 'websearch' });

    const { data, error, count } = await queryBuilder
      .order('member_count', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    const results: SearchResult[] = (data || []).map(community => ({
      id: community.id,
      type: 'community' as const,
      title: community.name,
      subtitle: community.category,
      content: community.description || '',
      description: community.description || '',
      created_at: community.created_at,
      member_count: community.member_count,
      relevance_score: community.member_count || 0,
      metadata: {
        category: community.category,
        member_count: community.member_count,
        is_private: community.is_private
      }
    }));

    return { data: results, count };
  }

  private static async searchEvents(query: string, filters: SearchFilters, page: number, limit: number) {
    let queryBuilder = supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        location,
        start_time,
        end_time,
        event_type,
        is_virtual,
        attendee_count,
        created_at,
        tags
      `, { count: 'exact' })
      .textSearch('search_vector', query, { type: 'websearch' });

    if (filters.location) {
      queryBuilder = queryBuilder.ilike('location', `%${filters.location}%`);
    }

    const { data, error, count } = await queryBuilder
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    const results: SearchResult[] = (data || []).map(event => ({
      id: event.id,
      type: 'event' as const,
      title: event.title,
      content: event.description || '',
      description: event.description || '',
      date: event.start_time,
      location: event.location,
      tags: event.tags,
      created_at: event.created_at,
      relevance_score: event.attendee_count || 0,
      metadata: {
        location: event.location,
        start_time: event.start_time,
        end_time: event.end_time,
        event_type: event.event_type,
        is_virtual: event.is_virtual,
        attendee_count: event.attendee_count,
        tags: event.tags
      }
    }));

    return { data: results, count };
  }

  private static async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      // Get trending topics that match the query
      const { data } = await supabase
        .from('trending_topics')
        .select('topic')
        .ilike('topic', `%${query}%`)
        .order('trend_score', { ascending: false })
        .limit(5);

      return (data || []).map(item => item.topic);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  private static getDateFilter(range: string): string {
    const now = new Date();
    switch (range) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(0).toISOString();
    }
  }

  static async getTrendingTopics(limit = 10): Promise<Array<{ topic: string; count: number }>> {
    try {
      const { data } = await supabase
        .from('trending_topics')
        .select('topic, mention_count')
        .order('trend_score', { ascending: false })
        .limit(limit);

      return (data || []).map(item => ({
        topic: item.topic,
        count: item.mention_count
      }));
    } catch (error) {
      console.error('Error getting trending topics:', error);
      return [];
    }
  }

  static async getRecommendedCommunities(limit = 5): Promise<any[]> {
    try {
      const { data } = await supabase
        .from('communities')
        .select(`
          id,
          name,
          description,
          member_count,
          category
        `)
        .eq('is_private', false)
        .order('member_count', { ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('Error getting recommended communities:', error);
      return [];
    }
  }
}
