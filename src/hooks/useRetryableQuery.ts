
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RetryableQueryOptions<T> {
  queryFn: () => Promise<T>;
  retryAttempts?: number;
  retryDelay?: number;
  enableRetry?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: T) => void;
}

interface RetryableQueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  retryCount: number;
  retry: () => void;
}

export function useRetryableQuery<T>({
  queryFn,
  retryAttempts = 3,
  retryDelay = 1000,
  enableRetry = true,
  onError,
  onSuccess,
}: RetryableQueryOptions<T>): RetryableQueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const executeQuery = useCallback(async (attempt: number = 0): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await queryFn();
      setData(result);
      setRetryCount(0);
      onSuccess?.(result);
    } catch (err) {
      const error = err as Error;
      console.error(`Query failed (attempt ${attempt + 1}):`, error);
      
      if (attempt < retryAttempts && enableRetry) {
        setRetryCount(attempt + 1);
        setTimeout(() => executeQuery(attempt + 1), retryDelay * Math.pow(2, attempt));
      } else {
        setError(error);
        setRetryCount(attempt + 1);
        onError?.(error);
        
        if (attempt >= retryAttempts) {
          toast({
            title: "Failed to load data",
            description: "Please check your connection and try again.",
            variant: "destructive",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [queryFn, retryAttempts, retryDelay, enableRetry, onError, onSuccess, toast]);

  const retry = useCallback(() => {
    setRetryCount(0);
    executeQuery(0);
  }, [executeQuery]);

  useEffect(() => {
    executeQuery(0);
  }, [executeQuery]);

  return { data, loading, error, retryCount, retry };
}
