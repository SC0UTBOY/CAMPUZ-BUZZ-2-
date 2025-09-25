
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Hash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TrendingHashtag {
  name: string;
  usage_count: number;
}

export const TrendingTopics: React.FC = () => {
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendingHashtags();
  }, []);

  const loadTrendingHashtags = async () => {
    try {
      const { data, error } = await supabase
        .from('hashtags')
        .select('name, usage_count')
        .order('usage_count', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTrendingHashtags(data || []);
    } catch (error) {
      console.error('Error loading trending hashtags:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending Topics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : trendingHashtags.length > 0 ? (
          trendingHashtags.map((hashtag, index) => (
            <div key={hashtag.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">
                  {index + 1}
                </span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {hashtag.name}
                </Badge>
              </div>
              <span className="text-xs text-gray-500">
                {hashtag.usage_count} posts
              </span>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500">
            No trending topics yet. Be the first to start a conversation with hashtags!
          </div>
        )}
      </CardContent>
    </Card>
  );
};
