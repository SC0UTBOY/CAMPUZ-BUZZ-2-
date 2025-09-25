
import { useState, useEffect } from 'react';

interface AppHealthStatus {
  isHealthy: boolean;
  errors: string[];
  warnings: string[];
  performanceIssues: string[];
}

export const useAppHealth = () => {
  const [health, setHealth] = useState<AppHealthStatus>({
    isHealthy: true,
    errors: [],
    warnings: [],
    performanceIssues: [],
  });

  useEffect(() => {
    const checkHealth = () => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const performanceIssues: string[] = [];

      // Check for stored errors
      try {
        const lastError = localStorage.getItem('lastError');
        if (lastError) {
          const errorData = JSON.parse(lastError);
          const errorAge = Date.now() - new Date(errorData.timestamp).getTime();
          if (errorAge < 5 * 60 * 1000) { // 5 minutes
            errors.push(`Recent error: ${errorData.message}`);
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }

      // Check performance
      if (typeof performance !== 'undefined') {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.fetchStart;
          if (loadTime > 5000) {
            performanceIssues.push(`Slow page load: ${Math.round(loadTime)}ms`);
          }
        }

        // Check memory usage (Chrome only)
        const memory = (performance as any).memory;
        if (memory) {
          const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
          if (memoryUsage > 90) {
            warnings.push(`High memory usage: ${Math.round(memoryUsage)}%`);
          }
        }
      }

      // Check network connectivity
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        warnings.push('Device is offline');
      }

      const isHealthy = errors.length === 0 && performanceIssues.length === 0;

      setHealth({
        isHealthy,
        errors,
        warnings,
        performanceIssues,
      });
    };

    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const clearErrors = () => {
    try {
      localStorage.removeItem('lastError');
    } catch (e) {
      // Ignore localStorage errors
    }
    
    setHealth(prev => ({
      ...prev,
      errors: [],
      isHealthy: prev.warnings.length === 0 && prev.performanceIssues.length === 0,
    }));
  };

  return {
    health,
    clearErrors,
  };
};
