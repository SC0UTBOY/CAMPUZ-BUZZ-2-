
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Hash } from 'lucide-react';

const trendingTopics = [
  { tag: 'DataStructures', posts: 42 },
  { tag: 'ReactTips', posts: 38 },
  { tag: 'StudyGroup', posts: 31 },
  { tag: 'Finals2024', posts: 29 },
  { tag: 'Programming', posts: 25 },
];

const trendingCommunities = [
  { name: 'Computer Science Hub', members: 1250 },
  { name: 'Study Buddies', members: 980 },
  { name: 'Tech Career Prep', members: 850 },
];

export const TrendingSidebar: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending Topics
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {trendingTopics.map((topic, index) => (
              <div key={topic.tag} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">#{index + 1}</span>
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium">{topic.tag}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {topic.posts}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Suggested Communities</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {trendingCommunities.map((community) => (
              <div key={community.name} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{community.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {community.members.toLocaleString()} members
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Join
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrendingSidebar;
