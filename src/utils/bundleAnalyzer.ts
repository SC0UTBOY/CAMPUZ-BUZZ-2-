
// Bundle analysis utilities for performance optimization

export interface BundleMetrics {
  totalSize: number;
  jsSize: number;
  cssSize: number;
  imageSize: number;
  cacheEfficiency: number;
  loadTime: number;
}

export const analyzeBundlePerformance = (): BundleMetrics => {
  const metrics: BundleMetrics = {
    totalSize: 0,
    jsSize: 0,
    cssSize: 0,
    imageSize: 0,
    cacheEfficiency: 0,
    loadTime: 0
  };

  // Analyze resource loading performance
  if ('performance' in window) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    resources.forEach(resource => {
      const size = resource.transferSize || 0;
      metrics.totalSize += size;
      
      if (resource.name.endsWith('.js')) {
        metrics.jsSize += size;
      } else if (resource.name.endsWith('.css')) {
        metrics.cssSize += size;
      } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        metrics.imageSize += size;
      }
      
      // Calculate cache efficiency
      if (resource.transferSize === 0 && resource.decodedBodySize > 0) {
        metrics.cacheEfficiency++;
      }
    });
    
    metrics.cacheEfficiency = resources.length > 0 ? 
      (metrics.cacheEfficiency / resources.length) * 100 : 0;
    
    // Get page load time
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
    }
  }
  
  return metrics;
};

export const getPerformanceRecommendations = (metrics: BundleMetrics): string[] => {
  const recommendations: string[] = [];
  
  // Bundle size recommendations
  if (metrics.jsSize > 500000) { // 500KB
    recommendations.push('Consider code splitting to reduce JavaScript bundle size');
  }
  
  if (metrics.cssSize > 100000) { // 100KB
    recommendations.push('Optimize CSS by removing unused styles');
  }
  
  if (metrics.imageSize > 1000000) { // 1MB
    recommendations.push('Compress images or use modern formats like WebP');
  }
  
  if (metrics.cacheEfficiency < 50) {
    recommendations.push('Improve cache headers for better resource caching');
  }
  
  if (metrics.loadTime > 3000) { // 3 seconds
    recommendations.push('Overall page load time is slow, consider performance optimization');
  }
  
  return recommendations;
};

export const trackCoreWebVitals = (): Promise<any> => {
  return new Promise((resolve) => {
    const vitals = {
      FCP: 0, // First Contentful Paint
      LCP: 0, // Largest Contentful Paint
      FID: 0, // First Input Delay
      CLS: 0  // Cumulative Layout Shift
    };

    // Track LCP
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        vitals.LCP = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Track FID
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          vitals.FID = entry.processingStart - entry.startTime;
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Track CLS
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        vitals.CLS = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Track FCP
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            vitals.FCP = entry.startTime;
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Resolve after a reasonable time
      setTimeout(() => {
        resolve(vitals);
      }, 5000);
    } else {
      resolve(vitals);
    }
  });
};
