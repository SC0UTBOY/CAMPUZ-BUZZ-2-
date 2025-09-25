import React, { memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard';
import { useInfinitePagination } from '@/hooks/useInfinitePagination';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { analyticsService } from '@/services/analyticsService';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  image_url?: string;
  title?: string;
  profiles: {
    display_name: string;
    avatar_url?: string;
    major?: string;
  };
}

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
  usePerformanceMonitor('OptimizedPostsList');

  // Memoized fetch function with enhanced error handling
  const fetchPosts = useMemo(() => async (page: number, limit: number): Promise<Post[]> => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (postsError) {
        console.error('Posts fetch error:', postsError);
        throw postsError;
      }

      if (!postsData || postsData.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(postsData.map(post => post.user_id))];

      // Get profiles with error handling
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, major')
        .in('user_id', userIds);

      if (profilesError) {
        console.warn('Profiles fetch error:', profilesError);
        // Continue without profiles rather than failing completely
      }

      // Create profiles map
      const profilesMap = new Map();
      if (profilesData) {
        profilesData.forEach(profile => {
          profilesMap.set(profile.user_id, profile);
        });
      }

      // Combine data with fallback for missing profiles
      return postsData
        .map(post => {
          const profile = profilesMap.get(post.user_id) || {
            display_name: 'Anonymous User',
            avatar_url: undefined,
            major: undefined
          };

          return {
            id: post.id,
            content: post.content || '',
            created_at: post.created_at,
            user_id: post.user_id,
            likes_count: post.likes_count || 0,
            comments_count: post.comments_count || 0,
            image_url: post.image_url,
            title: post.title,
            profiles: profile
          };
        })
        .filter(post => post !== null) as Post[];
        
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }, []);

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

  // Convert Post to EnhancedPostData format
  const convertToEnhancedPostData = (post: Post) => ({
    ...post,
    post_type: (post.image_url ? 'image' : 'text') as 'text' | 'image' | 'video' | 'poll',
    visibility: 'public' as 'public' | 'friends' | 'private',
    tags: [],
    shares_count: 0,
    saves_count: 0,
    hashtags: [],
    mentions: [],
    reactions: {},
    updated_at: post.created_at,
    author: {
      id: post.user_id,
      display_name: post.profiles.display_name,
      avatar_url: post.profiles.avatar_url,
      major: post.profiles.major,
      year: undefined
    },
    is_liked: false,
    is_saved: false,
    user_reaction: undefined,
    profiles: {
      id: post.user_id,
      display_name: post.profiles.display_name,
      avatar_url: post.profiles.avatar_url,
      major: post.profiles.major,
      year: undefined
    }
  });

  const handleReact = (postId: string, reactionType: string) => {
    console.log('React to post:', postId, reactionType);
    analyticsService.trackPostLiked(postId);
  };

  const handleSave = (postId: string) => {
    console.log('Save post:', postId);
    analyticsService.trackEvent('post_saved', { post_id: postId });
  };

  const handleShare = (postId: string) => {
    console.log('Share post:', postId);
    analyticsService.trackEvent('post_shared', { post_id: postId });
  };

  const handleComment = (postId: string) => {
    console.log('Comment on post:', postId);
    analyticsService.trackEvent('comment_opened', { post_id: postId });
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
        <EnhancedPostCard
          key={post.id}
          post={convertToEnhancedPostData(post)}
          onReact={handleReact}
          onSave={handleSave}
          onShare={handleShare}
          onComment={handleComment}
          className="mb-6"
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
