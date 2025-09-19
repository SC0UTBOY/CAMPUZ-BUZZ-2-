import React from 'react';

interface FastLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FastLoader: React.FC<FastLoaderProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-primary border-t-transparent`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
};

export const FastPageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <FastLoader size="lg" />
      <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

export const FastSkeletonPost = () => (
  <div className="bg-card border rounded-lg p-4 space-y-3">
    <div className="flex items-center space-x-3">
      <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-muted rounded w-24 animate-pulse" />
        <div className="h-3 bg-muted rounded w-32 animate-pulse" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-muted rounded w-full animate-pulse" />
      <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
    </div>
  </div>
);