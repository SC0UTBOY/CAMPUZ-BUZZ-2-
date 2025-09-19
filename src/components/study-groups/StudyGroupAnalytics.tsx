
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  FileText, 
  TrendingUp,
  Activity,
  Clock
} from 'lucide-react';
import { useStudyGroups } from '@/hooks/useStudyGroups';

interface StudyGroupAnalyticsProps {
  studyGroupId: string;
}

export const StudyGroupAnalytics: React.FC<StudyGroupAnalyticsProps> = ({ studyGroupId }) => {
  const { analytics, loadingAnalytics } = useStudyGroups(studyGroupId);

  if (loadingAnalytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No analytics available</h3>
          <p className="text-muted-foreground">Analytics will appear as your group becomes more active.</p>
        </CardContent>
      </Card>
    );
  }

  const formatActivityType = (type: string) => {
    switch (type) {
      case 'member_joined': return 'Member Joined';
      case 'session_created': return 'Session Created';
      case 'material_uploaded': return 'Material Uploaded';
      default: return type.replace('_', ' ').toUpperCase();
    }
  };

  const getActivityDescription = (activity: any) => {
    try {
      const value = typeof activity.metric_value === 'string' 
        ? JSON.parse(activity.metric_value) 
        : activity.metric_value;
      
      if (value && typeof value === 'object') {
        return value.title || value.user_id || 'Activity recorded';
      }
      return 'Activity recorded';
    } catch {
      return 'Activity recorded';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Members</p>
                <p className="text-2xl font-bold">{analytics.memberCount}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sessions</p>
                <p className="text-2xl font-bold">{analytics.sessionCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Materials</p>
                <p className="text-2xl font-bold">{analytics.materialCount}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Activity</p>
                <p className="text-2xl font-bold">{analytics.recentActivity.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {analytics.recentActivity.map((activity, index) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <div>
                      <p className="font-medium">{formatActivityType(activity.metric_type)}</p>
                      <p className="text-sm text-muted-foreground">
                        {getActivityDescription(activity)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(activity.recorded_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
