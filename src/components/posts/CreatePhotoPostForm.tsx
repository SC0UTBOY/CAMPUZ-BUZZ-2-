
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PostsService } from '@/services/postsService';
import { Image, X, Loader2 } from 'lucide-react';

interface CreatePhotoPostFormProps {
  userId: string;
  communityId?: string;
  onSuccess: () => void;
}

export const CreatePhotoPostForm: React.FC<CreatePhotoPostFormProps> = ({
  userId,
  communityId,
  onSuccess
}) => {
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, GIF, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!caption.trim()) {
      toast({
        title: "Caption required",
        description: "Please add a caption for your photo.",
        variant: "destructive"
      });
      return;
    }

    if (!imageFile) {
      toast({
        title: "Image required",
        description: "Please select an image to upload.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      await PostsService.createPhotoPost({
        title: title.trim() || undefined,
        content: caption.trim(),
        imageFile,
        userId,
        communityId
      });

      toast({
        title: "Photo posted!",
        description: "Your photo has been shared successfully."
      });

      // Reset form
      setTitle('');
      setCaption('');
      setImageFile(null);
      setImagePreview(null);

      // Notify parent
      onSuccess();
    } catch (error: any) {
      console.error('Error creating photo post:', error);
      toast({
        title: "Error creating photo post",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <Label htmlFor="photo-title">Title (Optional)</Label>
        <Input
          id="photo-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your photo a title..."
          className="mt-2"
          disabled={isUploading}
        />
      </div>

      {/* Image Upload */}
      <div>
        <Label>Photo</Label>
        <div className="mt-2">
          {imagePreview ? (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Upload preview" 
                className="w-full h-64 object-cover rounded-lg border border-border" 
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <Image className="h-12 w-12 text-muted-foreground mb-3" />
              <span className="text-sm text-foreground font-medium">Click to upload an image</span>
              <span className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 5MB</span>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageSelect}
                disabled={isUploading}
              />
            </label>
          )}
        </div>
      </div>

      {/* Caption */}
      <div>
        <Label htmlFor="photo-caption">Caption</Label>
        <Textarea
          id="photo-caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption for your photo..."
          className="mt-2 min-h-[100px]"
          required
          disabled={isUploading}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <Button 
          type="submit" 
          disabled={!caption.trim() || !imageFile || isUploading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Post Photo'
          )}
        </Button>
      </div>
    </form>
  );
};

