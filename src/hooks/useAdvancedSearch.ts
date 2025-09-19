
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchService, SearchFilters, SearchResult } from '@/services/searchService';
import { useDebounce } from '@/hooks/useDebounce';

export const useAdvancedSearch = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [page, setPage] = useState(1);
  
  const debouncedQuery = useDebounce(query, 300);

  const {
    data: searchResults,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['search', debouncedQuery, filters, page],
    queryFn: () => SearchService.search(debouncedQuery, filters, page),
    enabled: debouncedQuery.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const {
    data: trendingTopics,
    isLoading: loadingTrending
  } = useQuery({
    queryKey: ['trending-topics'],
    queryFn: () => SearchService.getTrendingTopics(10),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  const {
    data: recommendedCommunities,
    isLoading: loadingRecommended
  } = useQuery({
    queryKey: ['recommended-communities'],
    queryFn: () => SearchService.getRecommendedCommunities(5),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setPage(1);
  }, []);

  const loadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setFilters({});
    setPage(1);
  }, []);

  return {
    query,
    debouncedQuery,
    filters,
    results: searchResults?.results || [],
    suggestions: searchResults?.suggestions || [],
    total: searchResults?.total || 0,
    trendingTopics: trendingTopics || [],
    recommendedCommunities: recommendedCommunities || [],
    isLoading,
    loadingTrending,
    loadingRecommended,
    error,
    page,
    updateQuery,
    updateFilters,
    loadMore,
    clearSearch,
    refetch
  };
};
