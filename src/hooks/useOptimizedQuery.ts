
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useState, useRef, useCallback, useEffect } from 'react';

interface OptimizedQueryOptions<TData, TError = Error> extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  queryKey: any[];
  queryFn: () => Promise<TData>;
  cacheTime?: number;
  staleTime?: number;
  dedupe?: boolean;
  background?: boolean;
}

interface OptimizedQueryResult<TData, TError = Error> {
  data: TData | undefined;
  error: TError | null;
  isError: boolean;
  isPending: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isStale: boolean;
  refresh: () => void;
  prefetch: () => Promise<void>;
  refetch: () => void;
}

// In-memory cache for deduplication
const queryCache = new Map<string, { promise: Promise<any>; timestamp: number }>();

export const useOptimizedQuery = <TData, TError = Error>(
  options: OptimizedQueryOptions<TData, TError>
): OptimizedQueryResult<TData, TError> => {
  const {
    queryKey,
    queryFn,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 30 * 1000, // 30 seconds
    dedupe = true,
    background = false,
    ...restOptions
  } = options;

  const [prefetchData, setPrefetchData] = useState<TData | null>(null);
  const prefetchRef = useRef<boolean>(false);

  // Create cache key
  const cacheKey = JSON.stringify(queryKey);

  // Optimized query function with deduplication
  const optimizedQueryFn = useCallback(async (): Promise<TData> => {
    if (dedupe) {
      const cached = queryCache.get(cacheKey);
      const now = Date.now();

      // Return cached promise if it's still fresh
      if (cached && (now - cached.timestamp) < staleTime) {
        return cached.promise;
      }
    }

    // Create new promise
    const promise = queryFn();
    
    if (dedupe) {
      queryCache.set(cacheKey, {
        promise,
        timestamp: Date.now()
      });

      // Clean up cache after cacheTime
      setTimeout(() => {
        queryCache.delete(cacheKey);
      }, cacheTime);
    }

    return promise;
  }, [queryFn, cacheKey, dedupe, staleTime, cacheTime]);

  // Use React Query with optimized settings
  const result = useQuery({
    queryKey,
    queryFn: optimizedQueryFn,
    staleTime,
    gcTime: cacheTime,
    refetchOnWindowFocus: false,
    refetchOnMount: !prefetchRef.current,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...restOptions
  });

  // Prefetch function
  const prefetch = useCallback(async (): Promise<void> => {
    if (!prefetchRef.current && !result.data) {
      try {
        const data = await optimizedQueryFn();
        setPrefetchData(data);
        prefetchRef.current = true;
      } catch (error) {
        console.warn('Prefetch failed:', error);
      }
    }
  }, [optimizedQueryFn, result.data]);

  // Manual refresh function
  const refresh = useCallback(() => {
    queryCache.delete(cacheKey);
    result.refetch();
  }, [cacheKey, result]);

  // Background refresh for stale data
  const backgroundRefresh = useCallback(async () => {
    if (background && result.data && result.isStale) {
      try {
        await optimizedQueryFn();
      } catch (error) {
        console.warn('Background refresh failed:', error);
      }
    }
  }, [background, result.data, result.isStale, optimizedQueryFn]);

  // Trigger background refresh when data becomes stale
  useEffect(() => {
    if (background && result.isStale) {
      const timer = setTimeout(backgroundRefresh, 100);
      return () => clearTimeout(timer);
    }
  }, [background, result.isStale, backgroundRefresh]);

  return {
    data: result.data || prefetchData || undefined,
    error: result.error,
    isError: result.isError,
    isPending: result.isPending,
    isLoading: result.isLoading,
    isSuccess: result.isSuccess,
    isStale: result.isStale,
    refresh,
    prefetch,
    refetch: result.refetch
  };
};

// Utility for batch queries
export const useBatchQueries = <TData>(
  queries: Array<{ queryKey: any[]; queryFn: () => Promise<TData> }>
) => {
  const batchedQueryFn = useCallback(async () => {
    const results = await Promise.allSettled(
      queries.map(query => query.queryFn())
    );
    
    return results.map((result, index) => ({
      queryKey: queries[index].queryKey,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }, [queries]);

  return useQuery({
    queryKey: ['batch', ...queries.map(q => q.queryKey).flat()],
    queryFn: batchedQueryFn,
    staleTime: 30 * 1000
  });
};
