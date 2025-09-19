
import React from 'react';
import { SearchResult } from '@/services/searchService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Heart, MessageCircle, Share2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  total: number;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isLoading,
  total
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <h3 className="text-lg font-medium mb-2">No results found</h3>
          <p>Try adjusting your search terms or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Found {total} results
      </div>
      
      {results.map((result) => (
        <Card key={`${result.type}-${result.id}`} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            {result.type === 'post' && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={result.author?.avatar_url} />
                      <AvatarFallback>
                        {result.author?.display_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{result.author?.display_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(result.created_at!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Post</Badge>
                </div>
                
                {result.title && (
                  <h3 className="text-lg font-semibold">{result.title}</h3>
                )}
                
                <p className="text-muted-foreground line-clamp-3">
                  {result.description || result.content}
                </p>
                
                {result.tags && result.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {result.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Heart className="h-4 w-4" />
                    <span>{result.likes_count || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{result.comments_count || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {result.type === 'user' && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={result.avatar_url} />
                      <AvatarFallback>
                        {result.title?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{result.title}</h3>
                      <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                    </div>
                  </div>
                  <Badge variant="outline">User</Badge>
                </div>
                
                {result.description && (
                  <p className="text-muted-foreground line-clamp-2">
                    {result.description}
                  </p>
                )}
                
                <Button size="sm">Connect</Button>
              </div>
            )}

            {result.type === 'community' && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={result.avatar_url} />
                      <AvatarFallback>
                        {result.title?.charAt(0) || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{result.title}</h3>
                      <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                    </div>
                  </div>
                  <Badge variant="outline">Community</Badge>
                </div>
                
                {result.description && (
                  <p className="text-muted-foreground line-clamp-2">
                    {result.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{result.member_count || 0} members</span>
                  </div>
                  <Button size="sm">Join</Button>
                </div>
              </div>
            )}

            {result.type === 'event' && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{result.title}</h3>
                  <Badge variant="outline">Event</Badge>
                </div>
                
                {result.description && (
                  <p className="text-muted-foreground line-clamp-2">
                    {result.description}
                  </p>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  {result.date && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(result.date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {result.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{result.location}</span>
                    </div>
                  )}
                </div>
                
                <Button size="sm">RSVP</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
