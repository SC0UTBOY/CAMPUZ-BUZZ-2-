
// Performance optimization utilities
export const performanceUtils = {
  // Debounce function for search inputs
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  },

  // Throttle function for scroll events
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Lazy load images
  lazyLoadImage: (img: HTMLImageElement, src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              img.src = src;
              img.onload = () => resolve();
              img.onerror = reject;
              observer.unobserve(img);
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(img);
    });
  },

  // Optimize bundle size with code splitting
  dynamicImport: async <T>(importFn: () => Promise<T>): Promise<T> => {
    try {
      return await importFn();
    } catch (error) {
      console.error('Dynamic import failed:', error);
      throw error;
    }
  },

  // Preload critical resources
  preloadResource: (href: string, as: string): void => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  },

  // Memory management
  cleanupMemory: (): void => {
    // Force garbage collection if available (Chrome DevTools)
    if ('gc' in window) {
      (window as any).gc();
    }
  },

  // Service Worker cache strategies
  cacheStrategies: {
    // Cache first, then network
    cacheFirst: async (request: Request): Promise<Response> => {
      const cache = await caches.open('app-cache-v1');
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }
      const response = await fetch(request);
      cache.put(request, response.clone());
      return response;
    },

    // Network first, then cache
    networkFirst: async (request: Request): Promise<Response> => {
      const cache = await caches.open('app-cache-v1');
      try {
        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
      } catch {
        const cached = await cache.match(request);
        if (cached) {
          return cached;
        }
        throw new Error('No network and no cache');
      }
    }
  }
};

// Performance monitoring
export const performanceMonitor = {
  // Mark performance milestones
  mark: (name: string): void => {
    performance.mark(name);
  },

  // Measure time between marks
  measure: (name: string, startMark: string, endMark?: string): number => {
    performance.measure(name, startMark, endMark);
    const measure = performance.getEntriesByName(name)[0] as PerformanceMeasure;
    return measure.duration;
  },

  // Log long tasks
  observeLongTasks: (): void => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('Long task detected:', entry);
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    }
  },

  // Monitor memory usage
  getMemoryUsage: (): any => {
    return (performance as any).memory || {};
  }
};
