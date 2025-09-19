
import React from 'react';
import { StudySuggestions } from '@/components/ai/StudySuggestions';
import { TrendingTopics } from '@/components/feed/TrendingTopics';

export const FeedSidebar: React.FC = () => {
  return (
    <div className="space-y-6">
      <StudySuggestions />
      <TrendingTopics />
    </div>
  );
};
