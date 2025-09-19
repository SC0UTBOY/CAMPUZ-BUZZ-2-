
import { useEffect, useRef, useState } from 'react';
import { analyticsService } from '@/services/analyticsService';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
  networkLatency?: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const startTimeRef = useRef<number>(Date.now());
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const startTime = startTimeRef.current;
    const renderTime = Date.now() - startTime;

    // Get memory usage if available
    const memoryUsage = (performance as any).memory?.usedJSHeapSize;

    // Get network timing if available
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const networkLatency = navigation ? navigation.responseEnd - navigation.requestStart : undefined;

    const performanceMetrics: PerformanceMetrics = {
      loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : renderTime,
      renderTime,
      memoryUsage,
      networkLatency
    };

    setMetrics(performanceMetrics);

    // Track performance metrics
    analyticsService.trackEvent('performance_metrics', {
      component: componentName,
      ...performanceMetrics
    });

    // Log slow components
    if (renderTime > 1000) {
      console.warn(`Slow component render detected: ${componentName} took ${renderTime}ms`);
      analyticsService.trackEvent('slow_component', {
        component: componentName,
        render_time: renderTime
      });
    }
  }, [componentName]);

  return metrics;
};

// Hook for measuring specific operations
export const useOperationTimer = () => {
  const timerRef = useRef<{ [key: string]: number }>({});

  const startTimer = (operationName: string) => {
    timerRef.current[operationName] = performance.now();
  };

  const endTimer = (operationName: string, metadata?: Record<string, any>) => {
    const startTime = timerRef.current[operationName];
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    delete timerRef.current[operationName];

    // Track operation performance
    analyticsService.trackEvent('operation_performance', {
      operation: operationName,
      duration,
      ...metadata
    });

    return duration;
  };

  return { startTimer, endTimer };
};
