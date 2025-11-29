import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { createCommunityPost } from '@/services/communityActions';
import { uploadPostImage } from '@/integrations/supabase/storage';
import { supabase } from '@/integrations/supabase/client';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateImagePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  onSuccess: (newPost?: any) => void;
}

export default function CreateImagePostModal({
  open,
  onOpenChange,
  communityId,
  onSuccess
}: CreateImagePostModalProps) {
  const { toast } = useToast();
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please select an image to post.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Upload Image
      const { url: imageUrl, path: imagePath } = await uploadPostImage(selectedFile, communityId, user.id);

      // 2. Create Post
      const result = await createCommunityPost({
        user_id: user.id,
        community_id: communityId,
        caption,
        image_url: imageUrl,
        image_path: imagePath
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Your post has been created!"
        });

        // Reset form
        setCaption('');
        setSelectedFile(null);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        onSuccess(result.data);
        onOpenChange(false);
      } else {
        throw result.error;
      }
    } catch (error: any) {
      console.error('Error creating post:', error);

      let errorMessage = "Failed to create post. Please try again.";

      if (error?.message) {
        if (error.message.includes('not found') || error.message.includes('Bucket')) {
          errorMessage = "Image storage is not available. Please try again or contact support.";
        } else if (error.message.includes('permission') || error.message.includes('Permission denied')) {
          errorMessage = "You don't have permission to upload images. Please try logging out and back in.";
        } else if (error.message.includes('Not authenticated')) {
          errorMessage = "Please log in to upload images.";
        } else if (error.message.includes('size') || error.message.includes('large')) {
          errorMessage = "Image is too large. Please use an image under 5MB.";
        } else {
          // Show the actual error message if it's specific
          errorMessage = error.message;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (uploading) return;

    setCaption('');
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Create Image Post</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload Area */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Image *
                  </label>

                  {!preview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    >
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-1">
                        Click to upload an image
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF up to 5MB
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full rounded-lg max-h-96 object-contain bg-gray-100 dark:bg-gray-800"
                      />
                      {!uploading && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Caption Input */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Caption (optional)
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption for your image..."
                    rows={3}
                    disabled={uploading}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md resize-none focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!selectedFile || uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Post Image
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
