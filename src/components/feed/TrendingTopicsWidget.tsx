
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Hash, Users, MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { SearchService } from '@/services/searchService';

interface TrendingTopicsWidgetProps {
  onTopicClick?: (topic: string) => void;
}

export const TrendingTopicsWidget: React.FC<TrendingTopicsWidgetProps> = ({
  onTopicClick
}) => {
  const { data: trendingTopics, isLoading } = useQuery({
    queryKey: ['trending-topics'],
    queryFn: () => SearchService.getTrendingTopics(8),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  const { data: recommendedCommunities } = useQuery({
    queryKey: ['recommended-communities'],
    queryFn: () => SearchService.getRecommendedCommunities(3),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Trending</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trending Topics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Trending Topics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trendingTopics && trendingTopics.length > 0 ? (
              trendingTopics.map((topic, index) => (
                <div key={topic.topic} className="flex items-center justify-between group">
                  <button
                    onClick={() => onTopicClick?.(topic.topic)}
                    className="flex items-center space-x-3 text-left hover:text-blue-600 transition-colors"
                  >
                    <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-1">
                        <Hash className="h-3 w-3" />
                        <span className="font-medium">{topic.topic}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {topic.count} mentions
                      </div>
                    </div>
                  </button>
                  <Badge variant="secondary" className="ml-2">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Hot
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No trending topics yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Communities */}
      {recommendedCommunities && recommendedCommunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Suggested Communities</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendedCommunities.map((community) => (
                <div key={community.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{community.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center space-x-2">
                      <Users className="h-3 w-3" />
                      <span>{community.member_count} members</span>
                      {community.category && (
                        <>
                          <span>•</span>
                          <span>{community.category.replace('_', ' ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Join
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {trendingTopics?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Trending Topics
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {recommendedCommunities?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Active Communities
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
