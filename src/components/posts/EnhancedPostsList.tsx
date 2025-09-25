
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useRealtimePosts } from '@/hooks/useRealtimePosts';
import { enhancedPostsService } from '@/services/enhancedPostsService';
import { EnhancedPostCard } from './EnhancedPostCard';

interface EnhancedPostsListProps {
  communityId?: string;
  userId?: string;
  initialPosts?: any[];
  showFilter?: boolean;
  initialFilter?: {
    sortBy?: string;
    visibility?: string;
  };
}

export const EnhancedPostsList: React.FC<EnhancedPostsListProps> = ({ 
  communityId, 
  userId, 
  initialPosts,
  showFilter,
  initialFilter 
}) => {
  const [posts, setPosts] = useState(initialPosts || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { subscribeToPostUpdates } = useRealtimePosts();

  const {
    data: fetchedPosts,
    isLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['posts', communityId, userId],
    queryFn: () => enhancedPostsService.getPosts({ 
      type: initialFilter?.visibility as any,
      visibility: initialFilter?.visibility as any
    }),
    initialData: initialPosts,
    enabled: !initialPosts,
    staleTime: 60 * 1000, // 1 minute
  });

  useEffect(() => {
    if (fetchedPosts) {
      setPosts(fetchedPosts);
    }
  }, [fetchedPosts]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (queryError) {
      setError(queryError.message || "Failed to load posts.");
    }
  }, [queryError]);

  useEffect(() => {
    const subscriptions = posts.map((post: any) => subscribeToPostUpdates(post.id));
    
    return () => {
      subscriptions.forEach(unsub => unsub?.());
    };
  }, [posts, subscribeToPostUpdates]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      setError(null);
    } catch (err: any) {
      console.error("Error refreshing posts:", err);
      setError(err.message || "Failed to refresh posts.");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center space-x-2">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <p className="text-sm text-red-500">{error}</p>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {refreshing ? "Refreshing..." : "Retry"}
        </Button>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {posts.map((post: any) => (
        <EnhancedPostCard key={post.id} post={post} />
      ))}
    </AnimatePresence>
  );
};
