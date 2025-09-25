
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
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { imageUploadService, ImageUploadResult } from '@/services/imageUploadService';
// import { AutoTagSuggestions } from '@/components/ai/AutoTagSuggestions';

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
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploadResult, setImageUploadResult] = useState<ImageUploadResult | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please add some content to your post.",
        variant: "destructive"
      });
      return;
    }

    try {
      let finalImageUrl = imageUploadResult?.url || null;

      // If there's a new image file to upload
      if (imageFile && !imageUploadResult) {
        setIsUploadingImage(true);
        try {
          const uploadResult = await imageUploadService.uploadImage(imageFile);
          finalImageUrl = uploadResult.url;
          setImageUploadResult(uploadResult);
        } catch (uploadError) {
          toast({
            title: "Image upload failed",
            description: "Please try uploading the image again.",
            variant: "destructive"
          });
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      await onSubmit({
        title: title.trim() || undefined,
        content: content.trim(),
        image: finalImageUrl,
        tags: [...tags, ...hashtags],
        type: activeTab,
        mentions
      });

      // Reset form
      resetForm();
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Error creating post",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setImage(null);
    setImageFile(null);
    setImageUploadResult(null);
    setTags([]);
    setTagInput('');
    setMentions([]);
    setHashtags([]);
    setActiveTab('text');
    
    // Clean up preview URLs
    if (image) {
      imageUploadService.revokePreviewUrl(image);
    }
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate the image
    const validation = imageUploadService.validateImage(file);
    if (!validation.valid) {
      toast({
        title: "Invalid image",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    try {
      // Clean up previous preview
      if (image) {
        imageUploadService.revokePreviewUrl(image);
      }

      // Create preview
      const previewUrl = imageUploadService.createPreviewUrl(file);
      setImage(previewUrl);
      setImageFile(file);
      setImageUploadResult(null); // Reset previous upload result

      toast({
        title: "Image selected",
        description: `${file.name} ready to upload`
      });
    } catch (error) {
      console.error('Image selection error:', error);
      toast({
        title: "Error selecting image",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const removeImage = () => {
    if (image) {
      imageUploadService.revokePreviewUrl(image);
    }
    setImage(null);
    setImageFile(null);
    setImageUploadResult(null);
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

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a New Post</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
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
              <TabsTrigger value="event" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Event
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
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

                {/* Auto tag suggestions - temporarily disabled to avoid dependency issues */}
                {/* <AutoTagSuggestions
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
                /> */}
              </div>
            </TabsContent>

            <TabsContent value="image" className="space-y-4">
              <div>
                <Label htmlFor="image-title">Title</Label>
                <Input
                  id="image-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your image a caption..."
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Add an Image</Label>
                <div className="mt-2">
                  {image ? (
                    <div className="relative">
                      <img src={image} alt="Upload preview" className="w-full h-64 object-cover rounded-lg" />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                        disabled={isUploadingImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      
                      {/* Upload status indicator */}
                      {imageFile && !imageUploadResult && (
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                          Ready to upload
                        </div>
                      )}
                      
                      {imageUploadResult && (
                        <div className="absolute bottom-2 left-2 bg-green-500/80 text-white px-2 py-1 rounded text-xs">
                          ✓ Uploaded
                        </div>
                      )}
                      
                      {isUploadingImage && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                          <div className="text-white text-sm flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Uploading...
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <Image className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Click to upload an image</span>
                      <span className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, WebP (max 10MB)</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" 
                        onChange={handleImageUpload} 
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="image-content">Caption</Label>
                <Textarea
                  id="image-content"
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Write a caption for your image..."
                  className="min-h-[100px] mt-2"
                />
              </div>
            </TabsContent>

            <TabsContent value="poll" className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>Poll creation coming soon!</p>
              </div>
            </TabsContent>

            <TabsContent value="video" className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <Video className="h-12 w-12 mx-auto mb-4" />
                <p>Video posts coming soon!</p>
              </div>
            </TabsContent>

            <TabsContent value="event" className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4" />
                <p>Event creation coming soon!</p>
              </div>
            </TabsContent>
          </Tabs>

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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!content.trim() || isLoading || isUploadingImage}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {isUploadingImage ? 'Uploading...' : isLoading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
