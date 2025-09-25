
import React from 'react';
import { Trophy, Star, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AchievementBadge } from './AchievementBadge';
import { useAchievements } from '@/hooks/useAchievements';

export const AchievementsDisplay: React.FC = () => {
  const { achievements, loading } = useAchievements();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="w-20 h-20 bg-muted rounded-full mx-auto mb-2"></div>
                <div className="h-4 bg-muted rounded w-full mb-1"></div>
                <div className="h-3 bg-muted rounded w-3/4 mx-auto"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
            Achievements
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Award className="h-4 w-4 mr-1" />
            {achievements.length} earned
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {achievements.length === 0 ? (
          <div className="text-center py-8">
            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No achievements yet</h3>
            <p className="text-sm text-muted-foreground">
              Start participating in the community to earn your first badge!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievements.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                size="small"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
