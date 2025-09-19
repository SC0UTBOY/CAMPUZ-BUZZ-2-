
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseLazyLoadingOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

interface UseLazyLoadingReturn {
  ref: React.RefObject<HTMLDivElement>;
  isIntersecting: boolean;
  hasIntersected: boolean;
}

export const useLazyLoading = (options: UseLazyLoadingOptions = {}): UseLazyLoadingReturn => {
  const {
    threshold = 0.1,
    rootMargin = '100px',
    enabled = true
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    if (!enabled || !ref.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      { threshold, rootMargin }
    );

    observerRef.current.observe(ref.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, enabled, hasIntersected]);

  return { ref, isIntersecting, hasIntersected };
};
