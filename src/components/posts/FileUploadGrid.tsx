
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { X, Upload, Image, FileText, Video } from 'lucide-react';
import { fileUploadService, type UploadResult } from '@/services/fileUploadService';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadItem extends UploadResult {
  preview?: string;
  uploadProgress?: number;
  isUploading?: boolean;
  error?: string;
}

interface FileUploadGridProps {
  files: FileUploadItem[];
  onFilesChange: (files: FileUploadItem[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSizeInMB?: number;
}

export const FileUploadGrid: React.FC<FileUploadGridProps> = ({
  files,
  onFilesChange,
  maxFiles = 4,
  acceptedTypes = ['image/*', 'video/*'],
  maxSizeInMB = 10
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles);
    
    if (files.length + newFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive"
      });
      return;
    }

    newFiles.forEach(file => processFile(file));
  };

  const processFile = async (file: File) => {
    // Validate file size
    if (file.size > maxSizeInMB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File size must be less than ${maxSizeInMB}MB`,
        variant: "destructive"
      });
      return;
    }

    // Create preview for images
    let preview: string | undefined;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    // Add file to list with loading state
    const tempFile: FileUploadItem = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type.split('/')[1],
      mimeType: file.type,
      url: '',
      preview,
      isUploading: true,
      uploadProgress: 0
    };

    onFilesChange([...files, tempFile]);

    try {
      // Upload file with progress tracking
      const result = await fileUploadService.uploadFile(
        file,
        'post',
        'current-user', // This should come from auth context
        (progress) => {
          const updatedFiles = files.map(f => 
            f.fileName === file.name && f.isUploading
              ? { ...f, uploadProgress: progress }
              : f
          );
          // Add the new file if it's not in the list yet
          const fileExists = updatedFiles.some(f => f.fileName === file.name);
          if (!fileExists) {
            updatedFiles.push({ ...tempFile, uploadProgress: progress });
          }
          onFilesChange(updatedFiles);
        }
      );

      // Update file with final result
      const finalFiles = files.map(f => 
        f.fileName === file.name && f.isUploading
          ? { ...result, preview }
          : f
      );
      onFilesChange(finalFiles);

      toast({
        title: "Upload successful",
        description: `${file.name} uploaded successfully`
      });

    } catch (error) {
      console.error('Upload failed:', error);
      
      // Update file with error
      const errorFiles = files.map(f => 
        f.fileName === file.name && f.isUploading
          ? { ...f, isUploading: false, error: error instanceof Error ? error.message : 'Upload failed' }
          : f
      );
      onFilesChange(errorFiles);

      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: "destructive"
      });
    }
  };

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    
    // Revoke preview URL to prevent memory leaks
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }

    onFilesChange(files.filter((_, i) => i !== index));
  };

  const retryUpload = (index: number) => {
    const fileItem = files[index];
    if (fileItem.error) {
      // Create a new File object from the error state (this is a simplified approach)
      // In a real implementation, you'd store the original File object
      toast({
        title: "Retry not available",
        description: "Please re-select the file to retry upload",
        variant: "destructive"
      });
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    return FileText;
  };

  const canAddMore = files.length < maxFiles;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
            }
          `}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop files here, or click to select
          </p>
          <input
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            id="file-upload"
          />
          <Button asChild variant="outline" size="sm">
            <label htmlFor="file-upload" className="cursor-pointer">
              Choose Files
            </label>
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Max {maxFiles} files, {maxSizeInMB}MB each
          </p>
        </div>
      )}

      {/* File Grid */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            {files.map((file, index) => {
              const FileIcon = getFileIcon(file.mimeType);
              
              return (
                <motion.div
                  key={`${file.fileName}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative bg-muted rounded-lg overflow-hidden"
                >
                  {/* File Preview */}
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    {file.preview ? (
                      <img 
                        src={file.preview} 
                        alt={file.fileName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>

                  {/* File Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                    <p className="text-xs font-medium truncate">{file.fileName}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs opacity-90">
                        {(file.fileSize / 1024 / 1024).toFixed(1)} MB
                      </span>
                      {file.error && (
                        <Badge variant="destructive" className="text-xs">
                          Error
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {file.isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="bg-white rounded-lg p-3 min-w-[120px]">
                        <Progress value={file.uploadProgress || 0} className="mb-1" />
                        <p className="text-xs text-center">
                          Uploading... {Math.round(file.uploadProgress || 0)}%
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Remove Button */}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {/* Retry Button for failed uploads */}
                  {file.error && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-1 left-1 h-6 px-2 text-xs"
                      onClick={() => retryUpload(index)}
                    >
                      Retry
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
