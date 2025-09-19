
import React, { useState, useEffect } from 'react';
import { Tag, Users, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AIService, AutoTagResult } from '@/services/aiService';

interface AutoTagSuggestionsProps {
  content: string;
  title?: string;
  onTagSelect: (tag: string) => void;
  onCommunitySelect: (community: string) => void;
  selectedTags: string[];
  selectedCommunity?: string;
}

export const AutoTagSuggestions: React.FC<AutoTagSuggestionsProps> = ({
  content,
  title,
  onTagSelect,
  onCommunitySelect,
  selectedTags,
  selectedCommunity
}) => {
  const [suggestions, setSuggestions] = useState<AutoTagResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (content.length > 10) {
      getSuggestions();
    } else {
      setSuggestions(null);
    }
  }, [content, title]);

  const getSuggestions = async () => {
    setLoading(true);
    try {
      const result = await AIService.autoTagPost(content, title);
      setSuggestions(result);
    } finally {
      setLoading(false);
    }
  };

  if (!suggestions || (suggestions.suggestedTags.length === 0 && suggestions.suggestedCommunities.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
      <div className="flex items-center space-x-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">AI Suggestions</span>
        <Badge variant="outline" className="text-xs">
          {Math.round(suggestions.confidence * 100)}% confidence
        </Badge>
      </div>

      {suggestions.suggestedTags.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Tag className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Suggested Tags</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {suggestions.suggestedTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer text-xs hover:bg-primary/20 transition-colors"
                onClick={() => onTagSelect(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {suggestions.suggestedCommunities.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Suggested Communities</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {suggestions.suggestedCommunities.map((community) => (
              <Badge
                key={community}
                variant={selectedCommunity === community ? "default" : "outline"}
                className="cursor-pointer text-xs hover:bg-primary/20 transition-colors"
                onClick={() => onCommunitySelect(community)}
              >
                {community}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
