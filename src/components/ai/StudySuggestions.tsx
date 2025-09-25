
import React, { useState, useEffect } from 'react';
import { Brain, BookOpen, Users, TrendingUp, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AIService, StudySuggestion } from '@/services/aiService';
import { useAuth } from '@/contexts/AuthContext';

export const StudySuggestions: React.FC = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<StudySuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, [user?.id]);

  const loadSuggestions = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const data = await AIService.getStudySuggestions(user.id);
      setSuggestions(data);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'topic':
        return BookOpen;
      case 'group':
        return Users;
      case 'resource':
        return TrendingUp;
      default:
        return Sparkles;
    }
  };

  const getColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-blue-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI Study Suggestions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
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
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-primary" />
          <span>AI Study Suggestions</span>
          <Badge variant="secondary" className="ml-auto">
            Personalized
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No suggestions available yet</p>
            <p className="text-sm">Complete your profile to get personalized recommendations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => {
              const Icon = getIcon(suggestion.suggestion_type);
              return (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary mt-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{suggestion.title}</h4>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${getColor(suggestion.relevance_score)}`}
                          title={`${suggestion.relevance_score}% match`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {suggestion.relevance_score}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {suggestion.description}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                      >
                        {suggestion.suggestion_type}
                      </Badge>
                      {suggestion.suggestion_type === 'group' && (
                        <Button size="sm" variant="outline" className="h-6 text-xs">
                          Join Group
                        </Button>
                      )}
                      {suggestion.suggestion_type === 'resource' && (
                        <Button size="sm" variant="outline" className="h-6 text-xs">
                          View Resource
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadSuggestions}
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Refresh Suggestions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
