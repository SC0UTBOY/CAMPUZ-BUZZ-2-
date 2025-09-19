
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserActivity } from '@/hooks/useUserActivity';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, FileText, Users, Calendar, Activity } from 'lucide-react';

interface UserActivityTabProps {
  userId?: string;
}

export const UserActivityTab: React.FC<UserActivityTabProps> = ({ userId }) => {
  const { activities, loading, error } = useUserActivity(userId);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <FileText className="h-4 w-4" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'community_join':
        return <Users className="h-4 w-4" />;
      case 'event_rsvp':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'post':
        return 'bg-blue-500';
      case 'comment':
        return 'bg-green-500';
      case 'community_join':
        return 'bg-purple-500';
      case 'event_rsvp':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Failed to load activity: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No recent activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getActivityColor(activity.type)}`}>
            <div className="text-white">
              {getActivityIcon(activity.type)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm">{activity.title}</h4>
              <Badge variant="outline" className="text-xs">
                {activity.type.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {activity.description}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
