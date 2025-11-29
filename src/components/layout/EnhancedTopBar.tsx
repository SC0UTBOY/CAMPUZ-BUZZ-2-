
import React, { useState } from 'react';
import { Search, Plus, Menu, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { EnhancedCreatePostModal } from '@/components/posts/EnhancedCreatePostModal';
import { useToast } from '@/hooks/use-toast';
import { optimizedPostsService } from '@/services/optimizedPostsService';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface EnhancedTopBarProps {
  onMobileMenuToggle?: () => void;
  showMobileMenu?: boolean;
  onPostCreated?: () => void;
}

export const EnhancedTopBar: React.FC<EnhancedTopBarProps> = ({
  onMobileMenuToggle,
  showMobileMenu = false,
  onPostCreated
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePost = async (postData: any) => {
    try {
      setIsCreating(true);
      await optimizedPostsService.createPost(postData);
      setShowCreatePost(false);
      onPostCreated?.();
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

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={onMobileMenuToggle}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="font-bold text-xl text-primary">CampuzBuzz</div>
            </div>
          </div>

          {/* Center Section - Search (hidden on mobile) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search posts, users, communities..."
                className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="hidden sm:flex"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Create Post Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreatePost(true)}
              className="text-primary hover:text-primary/80"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:ml-2 sm:inline">Create</span>
            </Button>

            {/* Notifications */}
            <NotificationBell />

            {/* Search Button (mobile only) */}
            <Button variant="ghost" size="sm" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>

            {/* User Avatar */}
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>
                {user?.user_metadata?.display_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Create Post Modal */}
      <EnhancedCreatePostModal
        open={showCreatePost}
        onOpenChange={setShowCreatePost}
        onSubmit={handleCreatePost}
        isLoading={isCreating}
      />
    </>
  );
};
