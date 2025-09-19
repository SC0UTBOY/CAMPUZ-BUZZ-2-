import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { fileUploadService } from '@/services/fileUploadService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  fallbackText: string;
  onAvatarChange: (url: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  fallbackText,
  onAvatarChange,
  size = 'lg'
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16', 
    lg: 'h-24 w-24',
    xl: 'h-32 w-32'
  };

  const handleFileSelect = async (file: File) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload an avatar",
        variant: "destructive"
      });
      return;
    }

    // Validate file
    const validationResult = fileUploadService.validateFile(file, 'avatar');
    
    if (!validationResult.valid) {
      toast({
        title: "Invalid file",
        description: validationResult.error,
        variant: "destructive"
      });
      return;
    }

    // Create preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Delete old avatar if it exists
      if (currentAvatarUrl) {
        try {
          await fileUploadService.deleteFile(currentAvatarUrl, 'avatar');
        } catch (deleteError) {
          console.warn('Failed to delete old avatar:', deleteError);
        }
      }

      const result = await fileUploadService.uploadFile(
        file,
        'avatar',
        user.id,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      onAvatarChange(result.url);
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully"
      });

    } catch (error) {
      console.error('Avatar upload failed:', error);
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Failed to upload avatar',
        variant: "destructive"
      });

      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeAvatar = async () => {
    if (!currentAvatarUrl) return;

    try {
      await fileUploadService.deleteFile(currentAvatarUrl, 'avatar');
      onAvatarChange('');
      setPreviewUrl(null);
      
      toast({
        title: "Avatar removed",
        description: "Your profile picture has been removed"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove avatar",
        variant: "destructive"
      });
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="relative inline-block">
      <div
        className={`relative group cursor-pointer transition-transform ${isDragging ? 'scale-105' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <Avatar className={`${sizeClasses[size]} ring-4 ring-background shadow-lg transition-shadow group-hover:ring-primary/50`}>
          <AvatarImage src={displayUrl} />
          <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-lg">
            {fallbackText}
          </AvatarFallback>
        </Avatar>

        {/* Upload Overlay */}
        <div className={`absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center ${isUploading ? 'opacity-100' : ''}`}>
          {isUploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>

        {/* Drag & Drop Indicator */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -inset-4 border-2 border-dashed border-primary rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Upload className="h-8 w-8 text-primary" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Progress */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center"
            >
              <div className="text-center px-2">
                <div className="w-16 mb-2">
                  <Progress value={uploadProgress} className="h-1" />
                </div>
                <p className="text-xs text-white font-medium">{Math.round(uploadProgress)}%</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Remove Button */}
      <AnimatePresence>
        {displayUrl && !isUploading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Button
              size="sm"
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                removeAvatar();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Upload Instructions */}
      <p className="text-xs text-muted-foreground text-center mt-2 max-w-32">
        Click or drag image to upload
        <br />
        <span className="text-xs opacity-75">Max 5MB</span>
      </p>
    </div>
  );
};
