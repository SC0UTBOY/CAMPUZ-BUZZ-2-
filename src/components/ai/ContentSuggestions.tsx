
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Users, BookOpen, Calendar, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAIContentSuggestions } from '@/hooks/useAIContentSuggestions';

export const ContentSuggestions: React.FC = () => {
  const { suggestions, loading, dismissSuggestion } = useAIContentSuggestions();

  const getIcon = (type: string) => {
    switch (type) {
      case 'post':
        return MessageSquare;
      case 'community':
        return Users;
      case 'study_group':
        return BookOpen;
      case 'event':
        return Calendar;
      default:
        return Sparkles;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'post':
        return 'bg-blue-500';
      case 'community':
        return 'bg-green-500';
      case 'study_group':
        return 'bg-purple-500';
      case 'event':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
            AI Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
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

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            AI Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No suggestions available right now</p>
            <p className="text-sm">Complete your profile to get personalized recommendations</p>
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
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            AI Suggestions
          </div>
          <Badge variant="secondary" className="text-xs">
            Personalized
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <AnimatePresence>
            {suggestions.map((suggestion) => {
              const Icon = getIcon(suggestion.type);
              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="group"
                >
                  <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className={`p-2 rounded-full ${getTypeColor(suggestion.type)} text-white flex-shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1">
                            {suggestion.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            {suggestion.description}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {suggestion.type.replace('_', ' ')}
                            </Badge>
                            <div className="flex items-center">
                              <div
                                className={`w-2 h-2 rounded-full mr-1 ${
                                  suggestion.relevance_score >= 80 
                                    ? 'bg-green-500' 
                                    : suggestion.relevance_score >= 60 
                                    ? 'bg-yellow-500' 
                                    : 'bg-gray-500'
                                }`}
                              />
                              <span className="text-xs text-muted-foreground">
                                {suggestion.relevance_score}% match
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                          onClick={() => dismissSuggestion(suggestion.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};
