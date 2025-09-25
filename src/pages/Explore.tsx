
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Calendar, Hash } from 'lucide-react';
import { AdvancedSearchBar } from '@/components/search/AdvancedSearchBar';
import { SearchResults } from '@/components/search/SearchResults';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';

const Explore: React.FC = () => {
  const {
    query,
    results,
    suggestions,
    total,
    trendingTopics,
    recommendedCommunities,
    isLoading,
    updateQuery,
    updateFilters,
    clearSearch
  } = useAdvancedSearch();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Explore</h1>
        <AdvancedSearchBar
          query={query}
          onQueryChange={updateQuery}
          onFiltersChange={updateFilters}
          suggestions={suggestions}
          isLoading={isLoading}
        />
      </div>

      {query ? (
        <SearchResults results={results} isLoading={isLoading} total={total} />
      ) : (
        <Tabs defaultValue="trending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="trending">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="communities">
              <Users className="h-4 w-4 mr-2" />
              Communities
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Hash className="h-5 w-5 mr-2" />
                  Trending Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {trendingTopics.map((topic, index) => (
                    <Badge
                      key={topic.topic}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => updateQuery(`#${topic.topic}`)}
                    >
                      #{topic.topic}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {topic.count}
                      </span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recommended Communities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendedCommunities.map((community) => (
                    <div key={community.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={community.avatar_url} />
                          <AvatarFallback>
                            {community.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{community.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {community.description}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3 mr-1" />
                            {community.member_count} members
                          </div>
                        </div>
                      </div>
                      <Button size="sm">Join</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming events to display</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Explore;
