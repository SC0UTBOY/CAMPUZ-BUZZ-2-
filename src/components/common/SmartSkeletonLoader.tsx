
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface SmartSkeletonLoaderProps {
  type: 'post' | 'profile' | 'community' | 'chat' | 'event' | 'feed';
  count?: number;
  animated?: boolean;
}

export const SmartSkeletonLoader: React.FC<SmartSkeletonLoaderProps> = ({ 
  type, 
  count = 1,
  animated = true 
}) => {
  const PostSkeleton = () => (
    <Card className="mb-6">
      <CardHeader className="space-y-3">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="flex space-x-4 pt-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );

  const ProfileSkeleton = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start space-x-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="flex space-x-6">
              <div className="text-center space-y-1">
                <Skeleton className="h-6 w-8 mx-auto" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="text-center space-y-1">
                <Skeleton className="h-6 w-8 mx-auto" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="text-center space-y-1">
                <Skeleton className="h-6 w-8 mx-auto" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const CommunitySkeleton = () => (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      </CardContent>
    </Card>
  );

  const ChatSkeleton = () => (
    <div className="space-y-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <div className={`flex items-start space-x-2 max-w-xs ${i % 2 === 0 ? '' : 'flex-row-reverse space-x-reverse'}`}>
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className={`h-10 ${i % 3 === 0 ? 'w-32' : i % 3 === 1 ? 'w-24' : 'w-28'}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const EventSkeleton = () => (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const FeedSkeleton = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </CardContent>
      </Card>
      {Array.from({ length: 3 }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'post':
        return <PostSkeleton />;
      case 'profile':
        return <ProfileSkeleton />;
      case 'community':
        return <CommunitySkeleton />;
      case 'chat':
        return <ChatSkeleton />;
      case 'event':
        return <EventSkeleton />;
      case 'feed':
        return <FeedSkeleton />;
      default:
        return <PostSkeleton />;
    }
  };

  return (
    <div className={animated ? 'animate-pulse' : ''}>
      {type === 'feed' ? (
        renderSkeleton()
      ) : (
        Array.from({ length: count }).map((_, index) => (
          <div key={index} className={index > 0 ? 'mt-6' : ''}>
            {renderSkeleton()}
          </div>
        ))
      )}
    </div>
  );
};
