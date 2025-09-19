
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedCard } from '@/components/ui/enhanced-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { OptimisticUploadPreview } from '@/components/common/OptimisticUploadPreview';
import { useOptimisticUploads } from '@/hooks/useOptimisticUploads';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { LocationPicker } from '@/components/common/LocationPicker';
import { EmojiPicker } from '@/components/common/EmojiPicker';
import {
  Camera,
  Video,
  MapPin,
  Smile,
  Globe,
  Users,
  Lock,
  Hash,
  AtSign,
  BarChart3,
  Calendar,
  X
} from 'lucide-react';

interface Location {
  id: string;
  name: string;
  address: string;
}

interface ComprehensivePostCreatorProps {
  onSubmit: (postData: any) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  expanded?: boolean;
  className?: string;
}

export const ComprehensivePostCreator: React.FC<ComprehensivePostCreatorProps> = ({
  onSubmit,
  onCancel,
  placeholder = "What's happening in your academic journey?",
  expanded = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [location, setLocation] = useState<Location | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [isPoll, setIsPoll] = useState(false);
  
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const uploadHook = useOptimisticUploads('post');

  const maxCharacters = 2000;
  const characterCount = content.length;
  const isNearLimit = characterCount > maxCharacters * 0.8;
  const isOverLimit = characterCount > maxCharacters;

  const handleContentChange = (value: string) => {
    setContent(value);
    
    // Extract hashtags
    const hashtagMatches = value.match(/#\w+/g) || [];
    setHashtags(hashtagMatches.map(tag => tag.slice(1)));
    
    // Extract mentions
    const mentionMatches = value.match(/@\w+/g) || [];
    setMentions(mentionMatches.map(mention => mention.slice(1)));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      uploadHook.addFiles(Array.from(files));
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const newContent = content + emoji;
    setContent(newContent);
    handleContentChange(newContent);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !uploadHook.hasCompleted) {
      toast({
        title: "Content required",
        description: "Please add some content or upload media to your post.",
        variant: "destructive"
      });
      return;
    }

    if (isOverLimit) {
      toast({
        title: "Content too long",
        description: `Please keep your post under ${maxCharacters} characters.`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Upload any pending files
      await uploadHook.uploadAll();
      
      const postData = {
        content: content.trim(),
        visibility,
        post_type: uploadHook.hasCompleted ? 'image' as const : 'text' as const,
        images: uploadHook.getCompletedFiles(),
        location: location?.name,
        tags: hashtags,
        mentions,
        scheduled_at: scheduleDate || undefined
      };

      await onSubmit(postData);

      // Reset form
      setContent('');
      setLocation(null);
      setScheduleDate('');
      setIsPoll(false);
      uploadHook.clearFiles();
      setIsExpanded(false);
      
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
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    setLocation(null);
    setScheduleDate('');
    setIsPoll(false);
    uploadHook.clearFiles();
    setIsExpanded(false);
    onCancel?.();
  };

  const visibilityOptions = [
    { value: 'public' as const, icon: Globe, label: 'Public', description: 'Anyone can see this post' },
    { value: 'friends' as const, icon: Users, label: 'Friends', description: 'Only your connections can see this' },
    { value: 'private' as const, icon: Lock, label: 'Only me', description: 'Only you can see this post' }
  ];

  const currentVisibility = visibilityOptions.find(opt => opt.value === visibility);

  if (!isExpanded) {
    return (
      <EnhancedCard variant="glass" className={`cursor-pointer hover:shadow-md transition-shadow ${className}`}>
        <div className="p-4" onClick={() => setIsExpanded(true)}>
          <div className="flex gap-3 items-center">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold">
                {profile?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 bg-muted/50 rounded-full px-4 py-3 text-muted-foreground hover:bg-muted/70 transition-colors">
              {placeholder}
            </div>
          </div>
        </div>
      </EnhancedCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <EnhancedCard variant="glass">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold">
                {profile?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <p className="font-medium">{profile?.display_name || 'Anonymous User'}</p>
              {profile?.major && profile?.year && (
                <p className="text-sm text-muted-foreground">
                  {profile.major} • {profile.year}
                </p>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              {currentVisibility && (
                <Button variant="outline" size="sm" className="gap-2">
                  <currentVisibility.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{currentVisibility.label}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Content Input */}
          <div className="space-y-3">
            <Textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder={placeholder}
              className="min-h-[120px] resize-none border-0 bg-transparent p-0 text-lg focus-visible:ring-0"
              maxLength={maxCharacters}
            />
            
            {/* Character Count */}
            <div className="flex justify-end">
              <span className={`text-xs ${
                isOverLimit 
                  ? 'text-destructive' 
                  : isNearLimit 
                    ? 'text-warning' 
                    : 'text-muted-foreground'
              }`}>
                {characterCount}/{maxCharacters}
              </span>
            </div>
          </div>

          {/* Upload Preview */}
          <AnimatePresence>
            {uploadHook.files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <OptimisticUploadPreview
                  files={uploadHook.files}
                  onRemove={uploadHook.removeFile}
                  onRetry={uploadHook.retryUpload}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Location Display */}
          <AnimatePresence>
            {location && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
              >
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm flex-1">{location.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setLocation(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tags Preview */}
          <AnimatePresence>
            {(hashtags.length > 0 || mentions.length > 0) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2"
              >
                {hashtags.map((tag) => (
                  <Badge key={`#${tag}`} variant="secondary" className="text-blue-600 bg-blue-100 dark:bg-blue-900/20">
                    <Hash className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
                {mentions.map((mention) => (
                  <Badge key={`@${mention}`} variant="secondary" className="text-green-600 bg-green-100 dark:bg-green-900/20">
                    <AtSign className="h-3 w-3 mr-1" />
                    {mention}
                  </Badge>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <Separator />

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Media Upload */}
              <div className="flex items-center gap-1">
                <label htmlFor="image-upload">
                  <Button variant="ghost" size="sm" asChild>
                    <span className="cursor-pointer">
                      <Camera className="h-4 w-4" />
                    </span>
                  </Button>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <Button variant="ghost" size="sm" onClick={() => setIsPoll(!isPoll)}>
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Emoji Picker */}
              <EmojiPicker
                onEmojiSelect={handleEmojiSelect}
                trigger={
                  <Button variant="ghost" size="sm">
                    <Smile className="h-4 w-4" />
                  </Button>
                }
              />

              {/* Location Picker */}
              <LocationPicker
                onLocationSelect={setLocation}
                placeholder="Add location..."
                selectedLocation={location}
              />

              {/* Schedule */}
              <Button variant="ghost" size="sm">
                <Calendar className="h-4 w-4" />
              </Button>
            </div>

            {/* Post Actions */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={(!content.trim() && !uploadHook.hasCompleted) || isOverLimit || isLoading || uploadHook.hasUploading}
                size="sm"
                className="bg-primary hover:bg-primary/90 min-w-16"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  'Post'
                )}
              </Button>
            </div>
          </div>
        </div>
      </EnhancedCard>
    </motion.div>
  );
};
