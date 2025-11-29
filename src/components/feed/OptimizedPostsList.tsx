import React, { memo, useMemo, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PostCard } from '@/components/posts/PostCard';
import { useInfinitePagination } from '@/hooks/useInfinitePagination';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { analyticsService } from '@/services/analyticsService';
import { PostsService, PostData } from '@/services/postsService';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Using PostData from PostsService

// Memoized post skeleton component
const PostSkeleton = memo(() => (
  <Card className="mb-6">
    <CardContent className="p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-48 w-full rounded-lg mb-4" />
      <div className="flex items-center space-x-4 pt-4 border-t">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </CardContent>
  </Card>
));

PostSkeleton.displayName = 'PostSkeleton';

interface OptimizedPostsListProps {
  className?: string;
}

export const OptimizedPostsList: React.FC<OptimizedPostsListProps> = ({ className }) => {
  const { user } = useAuth();
  usePerformanceMonitor('OptimizedPostsList');

// Memoized fetch function with enhanced error handling
const fetchPosts = useMemo(() => async (page: number, limit: number): Promise<PostData[]> => {
  try {
    const data = await PostsService.getPosts(limit, (page - 1) * limit);
    return data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}, [user]);

  const {
    data: posts,
    loading,
    error,
    hasMore,
    sentryRef,
    refresh
  } = useInfinitePagination({
    fetchFunction: fetchPosts,
    initialLimit: 10,
    threshold: 0.3
  });

  // Track page view
  React.useEffect(() => {
    analyticsService.trackPageView('posts_feed');
  }, []);

  const handlePostUpdate = () => {
    refresh();
  };

  if (error && posts.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Failed to load posts</h3>
        <p className="text-muted-foreground mb-4">
          Something went wrong while loading the feed. Please try again.
        </p>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Posts list */}
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          onPostUpdate={handlePostUpdate}
        />
      ))}

      {/* Loading skeletons */}
      {loading && (
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <PostSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      )}

      {/* Intersection observer target */}
      {hasMore && (
        <div ref={sentryRef} className="h-10 flex items-center justify-center">
          {loading && (
            <div className="flex items-center text-muted-foreground text-sm">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Loading more posts...
            </div>
          )}
        </div>
      )}

      {/* End of feed */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">You've reached the end of the feed</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && !error && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No posts yet</h3>
          <p className="text-muted-foreground">Be the first to share something!</p>
        </div>
      )}
    </div>
  );
};
