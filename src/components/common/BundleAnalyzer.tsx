
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface BundleInfo {
  size: number;
  gzipSize?: number;
  loadTime: number;
  isLarge: boolean;
}

interface ResourceTiming extends PerformanceResourceTiming {
  transferSize: number;
  encodedBodySize: number;
}

export const BundleAnalyzer: React.FC = () => {
  const [bundleInfo, setBundleInfo] = useState<Record<string, BundleInfo>>({});
  const [totalBundleSize, setTotalBundleSize] = useState(0);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    analyzeBundle();
  }, []);

  const analyzeBundle = () => {
    const resources = performance.getEntriesByType('resource') as ResourceTiming[];
    const jsResources = resources.filter(resource => 
      resource.name.includes('.js') || resource.name.includes('.ts')
    );

    const bundleData: Record<string, BundleInfo> = {};
    let totalSize = 0;
    const newRecommendations: string[] = [];

    jsResources.forEach(resource => {
      const size = resource.transferSize || resource.encodedBodySize || 0;
      const loadTime = resource.responseEnd - resource.startTime;
      const isLarge = size > 250 * 1024; // 250KB threshold

      bundleData[resource.name] = {
        size,
        loadTime,
        isLarge
      };

      totalSize += size;

      // Generate recommendations
      if (isLarge) {
        newRecommendations.push(`Large bundle detected: ${resource.name} (${formatBytes(size)})`);
      }
      if (loadTime > 1000) {
        newRecommendations.push(`Slow loading resource: ${resource.name} (${loadTime.toFixed(0)}ms)`);
      }
    });

    // Additional recommendations
    if (totalSize > 1024 * 1024) { // 1MB
      newRecommendations.push('Total bundle size exceeds 1MB. Consider code splitting.');
    }

    if (jsResources.length > 20) {
      newRecommendations.push('Many JavaScript resources detected. Consider bundling optimization.');
    }

    setBundleInfo(bundleData);
    setTotalBundleSize(totalSize);
    setRecommendations(newRecommendations);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getScoreColor = (size: number): string => {
    if (size < 100 * 1024) return 'text-green-600'; // < 100KB
    if (size < 250 * 1024) return 'text-yellow-600'; // < 250KB
    return 'text-red-600'; // > 250KB
  };

  const getBundleScore = (): number => {
    const idealSize = 500 * 1024; // 500KB ideal total
    return Math.max(0, 100 - (totalBundleSize / idealSize) * 100);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Bundle Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Bundle Score</span>
                <Badge variant={getBundleScore() > 70 ? 'default' : 'destructive'}>
                  {getBundleScore().toFixed(0)}/100
                </Badge>
              </div>
              <Progress value={getBundleScore()} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Bundle Size:</span>
                <span className={`font-mono ${getScoreColor(totalBundleSize)}`}>
                  {formatBytes(totalBundleSize)}
                </span>
              </div>
            </div>

            <div>
              <span className="text-sm font-medium">Resource Breakdown:</span>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {Object.entries(bundleInfo).map(([name, info]) => {
                  const filename = name.split('/').pop() || name;
                  return (
                    <div key={name} className="flex justify-between items-center text-xs">
                      <span className="truncate flex-1 mr-2" title={name}>
                        {filename}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono ${getScoreColor(info.size)}`}>
                          {formatBytes(info.size)}
                        </span>
                        {info.isLarge && (
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {recommendations.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <strong>Optimization Recommendations:</strong>
              <ul className="list-disc list-inside text-sm space-y-1">
                {recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Optimization Tips:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Use lazy loading for components not immediately visible</li>
            <li>Implement code splitting at route level</li>
            <li>Consider using a bundler analyzer tool for detailed analysis</li>
            <li>Remove unused dependencies and code</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default BundleAnalyzer;
