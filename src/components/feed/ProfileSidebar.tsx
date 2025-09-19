
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useOptimizedProfile } from '@/hooks/useOptimizedProfile';

export const ProfileSidebar: React.FC = () => {
  const { profile, loading } = useOptimizedProfile();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-muted animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
              <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full bg-muted rounded animate-pulse"></div>
            <div className="h-3 w-3/4 bg-muted rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your Profile</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.avatar_url || ''} />
            <AvatarFallback>
              {profile.display_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{profile.display_name || 'Student'}</h3>
            <p className="text-sm text-muted-foreground">
              {profile.major || 'Student'}
              {profile.year && ` • ${profile.year}`}
            </p>
          </div>
        </div>
        
        {profile.bio && (
          <p className="text-sm text-muted-foreground mb-3">{profile.bio}</p>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Engagement</span>
          <Badge variant="secondary">{profile.engagement_score || 0} pts</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSidebar;
