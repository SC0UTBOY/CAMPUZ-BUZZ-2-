import React, { useState } from 'react';
import { EnhancedTopBar } from '@/components/layout/EnhancedTopBar';
import { OptimizedPostsList } from '@/components/feed/OptimizedPostsList';
import EnhancedFeedSidebar from '@/components/feed/EnhancedFeedSidebar';
import { TrendingTopicsWidget } from '@/components/feed/TrendingTopicsWidget';
import { CreatePostModal } from '@/components/posts/CreatePostModal';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { optimizedPostsService } from '@/services/optimizedPostsService';

const OptimizedHomeFeed: React.FC = () => {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  const handleCreatePost = async (postData: any) => {
    try {
      setIsCreating(true);
      await optimizedPostsService.createPost(postData);
      setShowCreatePost(false);
      setRefreshTrigger(prev => prev + 1);
      toast({
        title: "Post created!",
        description: "Your post has been shared successfully."
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error creating post",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handlePostCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <EnhancedTopBar onPostCreated={handlePostCreated} />
      
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-3 hidden lg:block">
            <EnhancedFeedSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-6 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setShowCreatePost(true)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Post
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter Feed
                  </Button>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Live Updates
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Posts Feed */}
            <OptimizedPostsList key={refreshTrigger} />
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-3 hidden lg:block space-y-6">
            <TrendingTopicsWidget />
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        open={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSubmit={handleCreatePost}
      />
    </div>
  );
};

export default OptimizedHomeFeed;
