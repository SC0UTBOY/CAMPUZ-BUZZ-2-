
import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Achievement } from '@/hooks/useAchievements';
import { formatDistanceToNow } from 'date-fns';

interface AchievementBadgeProps {
  achievement: Achievement;
  showDate?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  showDate = true,
  size = 'medium'
}) => {
  const sizeClasses = {
    small: 'w-16 h-16 text-2xl',
    medium: 'w-20 h-20 text-3xl',
    large: 'w-24 h-24 text-4xl'
  };

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-4 text-center">
          <div
            className={`${sizeClasses[size]} rounded-full ${achievement.achievement_data.color} flex items-center justify-center mx-auto mb-3 text-white font-bold shadow-lg`}
          >
            {achievement.achievement_data.icon}
          </div>
          <h3 className="font-semibold text-sm mb-1">
            {achievement.achievement_data.title}
          </h3>
          <p className="text-xs text-muted-foreground mb-2">
            {achievement.achievement_data.description}
          </p>
          {showDate && achievement.earned_at && (
            <Badge variant="outline" className="text-xs">
              {formatDistanceToNow(new Date(achievement.earned_at), { addSuffix: true })}
            </Badge>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
