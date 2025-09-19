
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Zap, Database, Wifi } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  networkLatency: number;
  fps: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const calculateMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const memory = (performance as any).memory;
      
      const loadTime = navigation ? navigation.loadEventEnd - navigation.fetchStart : 0;
      const renderTime = navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0;
      const memoryUsage = memory ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100 : 0;
      const networkLatency = navigation ? navigation.responseEnd - navigation.requestStart : 0;

      // Simulate cache hit rate (in a real app, this would come from your caching system)
      const cacheHitRate = 85 + Math.random() * 10;

      // Simple FPS counter
      let fps = 60;
      const fpsCounter = () => {
        let lastTime = performance.now();
        let frameCount = 0;
        
        const countFrames = () => {
          frameCount++;
          const currentTime = performance.now();
          if (currentTime - lastTime >= 1000) {
            fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
            frameCount = 0;
            lastTime = currentTime;
          }
          requestAnimationFrame(countFrames);
        };
        requestAnimationFrame(countFrames);
      };
      fpsCounter();

      setMetrics({
        loadTime: Math.round(loadTime),
        renderTime: Math.round(renderTime),
        memoryUsage: Math.round(memoryUsage),
        cacheHitRate: Math.round(cacheHitRate),
        networkLatency: Math.round(networkLatency),
        fps
      });
    };

    calculateMetrics();

    // Update metrics every 5 seconds
    const interval = setInterval(calculateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  // Show monitor in development or when performance issues detected
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    const hasPerformanceIssues = metrics && (
      metrics.loadTime > 3000 || 
      metrics.memoryUsage > 80 || 
      metrics.fps < 30
    );
    
    setIsVisible(isDev || !!hasPerformanceIssues);
  }, [metrics]);

  if (!isVisible || !metrics) return null;

  const getMetricColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceScore = () => {
    if (!metrics) return 0;
    
    let score = 100;
    
    // Load time penalty
    if (metrics.loadTime > 1000) score -= 20;
    else if (metrics.loadTime > 2000) score -= 40;
    else if (metrics.loadTime > 3000) score -= 60;
    
    // Memory usage penalty
    if (metrics.memoryUsage > 60) score -= 15;
    else if (metrics.memoryUsage > 80) score -= 30;
    
    // FPS penalty
    if (metrics.fps < 45) score -= 20;
    else if (metrics.fps < 30) score -= 40;
    
    // Cache hit rate bonus
    if (metrics.cacheHitRate > 90) score += 5;
    else if (metrics.cacheHitRate < 70) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  };

  const performanceScore = getPerformanceScore();

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance Monitor
            <Badge variant={performanceScore >= 80 ? 'default' : performanceScore >= 60 ? 'secondary' : 'destructive'}>
              {performanceScore}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Load Time
              </span>
              <span className={getMetricColor(metrics.loadTime, { good: 1000, warning: 2000 })}>
                {metrics.loadTime}ms
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                Memory
              </span>
              <span className={getMetricColor(metrics.memoryUsage, { good: 60, warning: 80 })}>
                {metrics.memoryUsage}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>FPS</span>
              <span className={getMetricColor(60 - metrics.fps, { good: 15, warning: 30 })}>
                {metrics.fps}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                Network
              </span>
              <span className={getMetricColor(metrics.networkLatency, { good: 100, warning: 300 })}>
                {metrics.networkLatency}ms
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Cache Hit</span>
              <span className="text-green-600">
                {metrics.cacheHitRate}%
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Overall Score</span>
              <span>{performanceScore}%</span>
            </div>
            <Progress value={performanceScore} className="h-1" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
