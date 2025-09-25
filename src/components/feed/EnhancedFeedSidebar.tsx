
import React from 'react';
import { ContentSuggestions } from '@/components/ai/ContentSuggestions';
import { AchievementsDisplay } from '@/components/achievements/AchievementsDisplay';
import { TrendingTopics } from '@/components/feed/TrendingTopics';

const EnhancedFeedSidebar: React.FC = () => {
  return (
    <div className="w-80 h-full overflow-y-auto space-y-6 p-4">
      {/* AI Content Suggestions */}
      <ContentSuggestions />
      
      {/* Achievements Display */}
      <AchievementsDisplay />
      
      {/* Trending Topics */}
      <TrendingTopics />
    </div>
  );
};

export default EnhancedFeedSidebar;
