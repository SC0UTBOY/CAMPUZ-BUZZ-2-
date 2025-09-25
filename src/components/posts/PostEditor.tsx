
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileUploadGrid } from './FileUploadGrid';
import { EmojiPicker } from '@/components/common/EmojiPicker';
import { LocationPicker } from '@/components/common/LocationPicker';
import { 
  Globe, 
  Lock, 
  Users, 
  MapPin, 
  Smile, 
  Hash,
  AtSign,
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  uploadProgress?: number;
  isUploading?: boolean;
  error?: string;
}

interface PostEditorProps {
  initialContent?: string;
  initialFiles?: FileUploadItem[];
  initialLocation?: Location;
  initialVisibility?: 'public' | 'friends' | 'private';
  placeholder?: string;
  onSubmit: (data: {
    content: string;
    files: FileUploadItem[];
    location?: Location;
    visibility: 'public' | 'friends' | 'private';
    hashtags: string[];
    mentions: string[];
  }) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitText?: string;
}

export const PostEditor: React.FC<PostEditorProps> = ({
  initialContent = '',
  initialFiles = [],
  initialLocation,
  initialVisibility = 'public',
  placeholder = "What's on your mind?",
  onSubmit,
  onCancel,
  isLoading = false,
  submitText = 'Post'
}) => {
  const [content, setContent] = useState(initialContent);
  const [files, setFiles] = useState<FileUploadItem[]>(initialFiles);
  const [location, setLocation] = useState<Location | null>(initialLocation || null);
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>(initialVisibility);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleContentChange = (value: string) => {
    setContent(value);
    
    // Extract hashtags
    const hashtagMatches = value.match(/#\w+/g) || [];
    const newHashtags = hashtagMatches.map(tag => tag.slice(1));
    setHashtags(newHashtags);
    
    // Extract mentions
    const mentionMatches = value.match(/@\w+/g) || [];
    const newMentions = mentionMatches.map(mention => mention.slice(1));
    setMentions(newMentions);
  };

  const handleEmojiSelect = (emoji: string) => {
    const newContent = content + emoji;
    setContent(newContent);
    handleContentChange(newContent);
    
    // Focus back to textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newContent.length, newContent.length);
        }
      }, 0);
    }
  };

  const handleLocationSelect = (selectedLocation: Location | null) => {
    setLocation(selectedLocation);
  };

  const handleSubmit = () => {
    const hasContent = content.trim().length > 0;
    const hasFiles = files.length > 0;
    
    if (!hasContent && !hasFiles) return;

    onSubmit({
      content: content.trim(),
      files: files.filter(file => !file.isUploading && !file.error),
      location: location || undefined,
      visibility,
      hashtags,
      mentions
    });
  };

  const visibilityOptions = [
    { value: 'public' as const, icon: Globe, label: 'Public', description: 'Anyone can see this post' },
    { value: 'friends' as const, icon: Users, label: 'Friends', description: 'Only your friends can see this' },
    { value: 'private' as const, icon: Lock, label: 'Only me', description: 'Only you can see this post' }
  ];

  const currentVisibility = visibilityOptions.find(opt => opt.value === visibility);
  
  const canSubmit = (content.trim().length > 0 || files.length > 0) && 
                   !files.some(f => f.isUploading) && 
                   !isLoading;

  const characterCount = content.length;
  const maxCharacters = 2000;
  const isNearLimit = characterCount > maxCharacters * 0.8;
  const isOverLimit = characterCount > maxCharacters;

  return (
    <div className="border rounded-lg bg-card p-4 space-y-4">
      {/* Content Input */}
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[120px] resize-none border-0 bg-transparent p-0 text-base focus-visible:ring-0"
          maxLength={maxCharacters}
        />
        
        {/* Character Count */}
        {characterCount > 0 && (
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
        )}
      </div>

      {/* File Upload */}
      <FileUploadGrid
        files={files}
        onFilesChange={setFiles}
        maxFiles={4}
        acceptedTypes={['image/*', 'video/*']}
        maxSizeInMB={10}
      />

      {/* Location Display */}
      <AnimatePresence>
        {location && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 p-2 bg-muted rounded-md"
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

      {/* Tags and Mentions Preview */}
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

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2">
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
            onLocationSelect={handleLocationSelect}
            placeholder="Add location..."
            selectedLocation={location}
          />

          {/* Visibility Selector */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                {currentVisibility && <currentVisibility.icon className="h-4 w-4" />}
                <span className="hidden sm:inline">{currentVisibility?.label}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="start">
              <div className="space-y-3">
                <h4 className="font-medium">Who can see this post?</h4>
                {visibilityOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`
                      flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors
                      ${visibility === option.value 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'hover:bg-muted'
                      }
                    `}
                    onClick={() => setVisibility(option.value)}
                  >
                    <option.icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isOverLimit}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? 'Publishing...' : submitText}
          </Button>
        </div>
      </div>
    </div>
  );
};
