
import React, { useState, useCallback, useRef } from 'react';
import { useLazyLoading } from '@/hooks/useLazyLoading';

interface UseInfinitePaginationOptions<T> {
  fetchFunction: (page: number, limit: number) => Promise<T[]>;
  initialLimit?: number;
  threshold?: number;
  enabled?: boolean;
}

interface UseInfinitePaginationReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  sentryRef: React.RefObject<HTMLDivElement>;
}

export function useInfinitePagination<T>({
  fetchFunction,
  initialLimit = 20,
  threshold = 0.5,
  enabled = true
}: UseInfinitePaginationOptions<T>): UseInfinitePaginationReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const loadingRef = useRef(false);

  const { ref: sentryRef, isIntersecting } = useLazyLoading({
    threshold,
    enabled: enabled && hasMore && !loading
  });

  const loadMore = useCallback(async (isRefresh = false) => {
    if (loadingRef.current) return;
    
    setLoading(true);
    loadingRef.current = true;
    setError(null);

    const currentPage = isRefresh ? 1 : page;
    
    try {
      const newData = await fetchFunction(currentPage, initialLimit);
      
      if (newData.length < initialLimit) {
        setHasMore(false);
      }

      if (isRefresh) {
        setData(newData);
        setPage(2);
        setHasMore(newData.length === initialLimit);
      } else {
        setData(prev => [...prev, ...newData]);
        setPage(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchFunction, initialLimit, page]);

  const refresh = useCallback(() => {
    setPage(1);
    setHasMore(true);
    loadMore(true);
  }, [loadMore]);

  // Load more when sentry comes into view
  React.useEffect(() => {
    if (isIntersecting && hasMore && !loading && enabled) {
      loadMore();
    }
  }, [isIntersecting, hasMore, loading, enabled, loadMore]);

  // Initial load
  React.useEffect(() => {
    if (enabled && data.length === 0 && !loading) {
      loadMore(true);
    }
  }, [enabled]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    sentryRef
  };
}
