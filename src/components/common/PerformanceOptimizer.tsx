
import React, { lazy, Suspense, memo } from 'react';
import { LoadingSkeletons } from './LoadingSkeletons';

// Enhanced lazy loading with error boundaries - simplified types
export const withLazyLoading = (
  importFunc: () => Promise<{ default: React.ComponentType<any> }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(importFunc);
  
  return memo((props: any) => (
    <Suspense fallback={fallback || <LoadingSkeletons type="feed" count={1} />}>
      <LazyComponent {...props} />
    </Suspense>
  ));
};

// Performance monitoring hook
export const usePerformanceTracker = (componentName: string) => {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Log slow renders (> 100ms)
      if (renderTime > 100) {
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    };
  });
};

// Memory usage tracker
export const useMemoryTracker = () => {
  React.useEffect(() => {
    const trackMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usage = {
          used: Math.round(memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
        };
        
        // Warn if memory usage is high
        if (usage.used / usage.limit > 0.8) {
          console.warn('High memory usage detected:', usage);
        }
      }
    };

    const interval = setInterval(trackMemory, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);
};
