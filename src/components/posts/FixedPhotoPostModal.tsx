import React, { useState, useRef } from 'react';
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
  Upload,
  FileText,
  Camera
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { imageUploadService, ImageUploadResult } from '@/services/imageUploadService';

interface FixedPhotoPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (post: any) => void;
  isLoading?: boolean;
}

export const FixedPhotoPostModal: React.FC<FixedPhotoPostModalProps> = ({ 
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      let finalImageUrl: string | null = null;

      // If there's an image file to upload
      if (imageFile) {
        setIsUploadingImage(true);
        try {
          console.log('Uploading image:', imageFile.name);
          const uploadResult = await imageUploadService.uploadImage(imageFile);
          finalImageUrl = uploadResult.url;
          console.log('Image uploaded successfully:', finalImageUrl);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          toast({
            title: "Image upload failed",
            description: uploadError instanceof Error ? uploadError.message : "Please try uploading the image again.",
            variant: "destructive"
          });
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      const postData = {
        title: title.trim() || undefined,
        content: content.trim(),
        image: finalImageUrl, // This will be mapped to image_url in the hook
        tags: tags,
        type: activeTab,
        post_type: activeTab === 'photo' ? 'image' : 'text'
      };

      console.log('Submitting post data:', postData);
      await onSubmit(postData);

      // Reset form
      resetForm();
      onOpenChange(false);
      
      toast({
        title: "Post created!",
        description: "Your post has been published successfully."
      });
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Error creating post",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setImage(null);
    setImageFile(null);
    setTags([]);
    setTagInput('');
    setActiveTab('text');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = imageUploadService.validateImage(file);
    if (!validation.valid) {
      toast({
        title: "Invalid image",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setImageFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Switch to photo tab
    setActiveTab('photo');
  };

  const removeImage = () => {
    setImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (tagInput.trim()) {
        addTag();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a New Post</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Text
              </TabsTrigger>
              <TabsTrigger value="photo" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Photo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
              <div>
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your post..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="mt-1 min-h-[120px] resize-none"
                  required
                />
              </div>
            </TabsContent>

            <TabsContent value="photo" className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your photo a title..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Add an Image</Label>
                <div className="mt-2">
                  {!image ? (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Drag and drop an image, or click to select
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Image className="h-4 w-4 mr-2" />
                        Choose Image
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={image}
                        alt="Preview"
                        className="w-full max-h-64 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                        Ready to upload
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write a caption for your photo..."
                  className="mt-1 min-h-[100px] resize-none"
                  required
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Tags Section */}
          <div>
            <Label>Tags</Label>
            <div className="mt-2 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag..."
                  className="flex-1"
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading || isUploadingImage}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isUploadingImage || !content.trim()}
            >
              {isUploadingImage ? 'Uploading...' : isLoading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
