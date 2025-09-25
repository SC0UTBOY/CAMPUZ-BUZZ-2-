
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface LoadingSkeletonsProps {
  type: 'feed' | 'profile' | 'chat' | 'communities';
  count?: number;
}

export const LoadingSkeletons: React.FC<LoadingSkeletonsProps> = ({ type, count = 3 }) => {
  const FeedSkeleton = () => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5"></div>
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex space-x-4">
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ProfileSkeleton = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start space-x-6">
          <div className="h-24 w-24 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="flex-1 space-y-4">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ChatSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start space-x-3">
          <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="flex-1">
            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const CommunitiesSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-8 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'feed':
        return Array.from({ length: count }).map((_, i) => <FeedSkeleton key={i} />);
      case 'profile':
        return <ProfileSkeleton />;
      case 'chat':
        return <ChatSkeleton />;
      case 'communities':
        return <CommunitiesSkeleton />;
      default:
        return <FeedSkeleton />;
    }
  };

  return <div>{renderSkeleton()}</div>;
};
