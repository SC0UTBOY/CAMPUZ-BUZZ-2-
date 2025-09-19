
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileSidebar } from '@/components/feed/ProfileSidebar';
import { TrendingSidebar } from '@/components/feed/TrendingSidebar';
import { EnhancedPostsList } from '@/components/posts/EnhancedPostsList';
import { CreatePostModal } from '@/components/posts/CreatePostModal';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { EnhancedPostsService } from '@/services/enhancedPostsService';
import { useToast } from '@/hooks/use-toast';

const EnhancedHomeFeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default') {
      const requestPermission = async () => {
        const permission = await window.Notification.requestPermission();
        if (permission === 'granted') {
          toast({
            title: "Notifications enabled",
            description: "You'll receive real-time notifications for interactions."
          });
        }
      };
      
      // Delay the request slightly to not overwhelm the user
      const timer = setTimeout(requestPermission, 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleCreatePost = async (postData: any) => {
    try {
      setIsCreating(true);
      if (!user?.id) throw new Error('User not authenticated');

      await EnhancedPostsService.createPost({
        content: postData.content,
        title: postData.title,
        post_type: postData.type || 'text',
        user_id: user.id,
        visibility: postData.visibility || 'public',
        tags: postData.tags,
        mentions: postData.mentions,
        image_url: postData.images?.[0]?.url
      });
      setShowCreatePost(false);
      toast({
        title: "Success!",
        description: "Your post has been created successfully."
      });
    } catch (error) {
      console.error('Failed to create post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view your feed</h1>
          <p className="text-muted-foreground">You need to be authenticated to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <ProfileSidebar />
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-6">
            <div className="space-y-6">
              {/* Create Post Button */}
              <div className="bg-card rounded-lg border p-4 shadow-sm">
                <Button 
                  onClick={() => setShowCreatePost(true)}
                  className="w-full justify-start text-left bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  size="lg"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  What's on your mind, {user.email?.split('@')[0]}?
                </Button>
              </div>

              {/* Enhanced Posts List */}
              <EnhancedPostsList
                initialFilter={{
                  sortBy: 'recent',
                  visibility: 'public'
                }}
              />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <TrendingSidebar />
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

export default EnhancedHomeFeed;
