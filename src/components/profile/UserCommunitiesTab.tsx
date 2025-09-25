
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserCommunities } from '@/hooks/useUserCommunities';
import { formatDistanceToNow } from 'date-fns';
import { Users, Lock, Globe } from 'lucide-react';

interface UserCommunitiesTabProps {
  userId?: string;
}

export const UserCommunitiesTab: React.FC<UserCommunitiesTabProps> = ({ userId }) => {
  const { communities, loading, error } = useUserCommunities(userId);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Failed to load communities: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (communities.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Not a member of any communities yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {communities.map((community) => (
        <Card key={community.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {community.is_private ? (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                )}
                {community.name}
              </CardTitle>
              {community.category && (
                <Badge variant="outline" className="text-xs">
                  {community.category}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {community.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {community.description}
              </p>
            )}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{community.member_count} members</span>
              </div>
              <span className="text-muted-foreground">
                Joined {formatDistanceToNow(new Date(community.joined_at), { addSuffix: true })}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
