
import React, { useState } from 'react';
import { EnhancedCard } from '@/components/ui/enhanced-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PostEditor } from './PostEditor';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedPostCreatorProps {
  onSubmit: (post: any) => Promise<void>;
  placeholder?: string;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  disabled?: boolean;
}

interface Location {
  id: string;
  name: string;
  address: string;
  coordinates?: { lat: number; lng: number; };
}

interface FileUploadItem {
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  url: string;
  preview?: string;
}

export const EnhancedPostCreator: React.FC<EnhancedPostCreatorProps> = ({
  onSubmit,
  placeholder = "What's happening?",
  expanded,
  onExpandedChange,
  disabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded || false);
  const [loading, setLoading] = useState(false);
  
  const { profile } = useUserProfile();
  const { toast } = useToast();

  const handleExpand = () => {
    if (disabled) return;
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandedChange?.(newExpanded);
  };

  const handleSubmit = async (data: {
    content: string;
    files: FileUploadItem[];
    location?: Location;
    visibility: 'public' | 'friends' | 'private';
    hashtags: string[];
    mentions: string[];
  }) => {
    if (disabled) return;
    
    if (!data.content.trim() && data.files.length === 0) {
      toast({
        title: "Content required",
        description: "Please add some content or images to your post.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const postData = {
        content: data.content,
        images: data.files.length > 0 ? data.files : undefined,
        location: data.location?.name || undefined,
        visibility: data.visibility,
        tags: [...data.hashtags, ...data.mentions],
        mentions: data.mentions,
        post_type: data.files.length > 0 ? 'image' as const : 'text' as const
      };

      await onSubmit(postData);

      // Reset form
      setIsExpanded(false);
      onExpandedChange?.(false);
      
      toast({
        title: "Post created",
        description: "Your post has been shared successfully!"
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsExpanded(false);
    onExpandedChange?.(false);
  };

  if (!isExpanded) {
    // Collapsed state - simple input that expands when clicked
    return (
      <EnhancedCard variant="glass" className={`overflow-hidden ${disabled ? 'opacity-50' : ''}`}>
        <div className="p-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold">
                {profile?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div 
              className={`flex-1 bg-muted/50 rounded-full px-4 py-3 transition-colors ${
                disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-muted/70'
              }`}
              onClick={handleExpand}
            >
              <span className="text-muted-foreground">
                {disabled ? 'Offline - Please connect to create posts' : placeholder}
              </span>
            </div>
          </div>
        </div>
      </EnhancedCard>
    );
  }

  return (
    <EnhancedCard variant="glass" className={`overflow-hidden ${disabled ? 'opacity-50' : ''}`}>
      <div className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20 flex-shrink-0">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold">
              {profile?.display_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <p className="font-medium text-sm">{profile?.display_name || 'Anonymous User'}</p>
              {profile?.major && profile?.year && (
                <p className="text-xs text-muted-foreground">
                  {profile.major} • {profile.year}
                </p>
              )}
            </div>

            <PostEditor
              placeholder={placeholder}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={loading || disabled}
              submitText="Post"
            />
          </div>
        </div>
      </div>
    </EnhancedCard>
  );
};
