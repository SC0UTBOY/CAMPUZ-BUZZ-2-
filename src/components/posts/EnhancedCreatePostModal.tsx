
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Image, 
  X, 
  Hash, 
  AtSign, 
  BarChart3,
  FileText,
  Video,
  Mic,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AutoTagSuggestions } from '@/components/ai/AutoTagSuggestions';
import { supabase } from '@/integrations/supabase/client';
import { CreatePhotoPostForm } from './CreatePhotoPostForm';
import { useAuth } from '@/contexts/AuthContext';

interface EnhancedCreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (post: any) => void;
  isLoading?: boolean;
}

export const EnhancedCreatePostModal: React.FC<EnhancedCreatePostModalProps> = ({ 
  open, 
  onOpenChange, 
  onSubmit,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please add some content to your post.",
        variant: "destructive"
      });
      return;
    }

    await onSubmit({
      title: title.trim() || undefined,
      content: content.trim(),
      post_type: 'text',
      visibility: 'public',
      tags: tags,
      mentions: mentions
    });

    // Reset form
    setTitle('');
    setContent('');
    setTags([]);
    setTagInput('');
    setMentions([]);
    setHashtags([]);
    setActiveTab('text');
    onOpenChange(false);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const extractHashtags = (text: string) => {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    if (matches) {
      const newHashtags = matches.map(tag => tag.slice(1));
      setHashtags([...new Set([...hashtags, ...newHashtags])]);
    }
  };

  const extractMentions = (text: string) => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    if (matches) {
      const newMentions = matches.map(mention => mention.slice(1));
      setMentions([...new Set([...mentions, ...newMentions])]);
    }
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    extractHashtags(value);
    extractMentions(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a New Post</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Photo
            </TabsTrigger>
            <TabsTrigger value="poll" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Poll
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video
            </TabsTrigger>
          </TabsList>

          {/* Text Post Form */}
          <TabsContent value="text" className="space-y-4">
            <form onSubmit={handleTextSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your post a title..."
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="content">What's on your mind?</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Share something with your community... Use #hashtags and @mentions"
                  className="min-h-[120px] mt-2"
                  required
                />
                
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    <span>Use hashtags</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AtSign className="h-3 w-3" />
                    <span>Mention users</span>
                  </div>
                </div>

                <AutoTagSuggestions
                  content={content}
                  onTagSelect={(tag) => {
                    if (!tags.includes(tag)) {
                      setTags([...tags, tag]);
                    }
                  }}
                  onCommunitySelect={(community) => {
                    console.log('Selected community:', community);
                  }}
                  selectedTags={tags}
                />
              </div>

              <div>
            <Label>Tags</Label>
            <div className="mt-2 space-y-2">
              <div className="flex space-x-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              
              {(tags.length > 0 || hashtags.length > 0 || mentions.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {hashtags.map((tag) => (
                    <Badge key={`#${tag}`} variant="outline" className="text-blue-600">
                      #{tag}
                    </Badge>
                  ))}
                  {mentions.map((mention) => (
                    <Badge key={`@${mention}`} variant="outline" className="text-green-600">
                      @{mention}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!content.trim() || isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {isLoading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      </TabsContent>

      {/* Photo Post Form */}
      <TabsContent value="image" className="space-y-4">
        {user && (
          <CreatePhotoPostForm
            userId={user.id}
            communityId={undefined}
            onSuccess={() => {
              onOpenChange(false);
            }}
          />
        )}
      </TabsContent>

      {/* Poll Placeholder */}
      <TabsContent value="poll" className="space-y-4">
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-4" />
          <p>Poll creation coming soon!</p>
        </div>
      </TabsContent>

      {/* Video Placeholder */}
      <TabsContent value="video" className="space-y-4">
        <div className="text-center py-8 text-gray-500">
          <Video className="h-12 w-12 mx-auto mb-4" />
          <p>Video posts coming soon!</p>
        </div>
      </TabsContent>
    </Tabs>
      </DialogContent>
    </Dialog>
  );
};
