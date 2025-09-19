import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { fileUploadService, type FileUploadType, type UploadResult } from '@/services/fileUploadService';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, X, File, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  type: FileUploadType;
  onUploadComplete: (result: UploadResult) => void;
  onUploadStart?: () => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
  children?: React.ReactNode;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  type,
  onUploadComplete,
  onUploadStart,
  accept,
  multiple = false,
  maxFiles = 1,
  className = '',
  children
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || !user) return;

    const filesToUpload = Array.from(files).slice(0, maxFiles);
    
    setUploading(true);
    onUploadStart?.();

    try {
      for (const file of filesToUpload) {
        const validation = fileUploadService.validateFile(file, type);
        if (!validation.valid) {
          toast({
            title: 'Invalid file',
            description: validation.error,
            variant: 'destructive'
          });
          continue;
        }

        const result = await fileUploadService.uploadFile(
          file,
          type,
          user.id,
          setProgress
        );

        onUploadComplete(result);
        
        toast({
          title: 'Upload successful',
          description: `${file.name} has been uploaded.`
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your file.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
      />
      
      {children ? (
        <div onClick={() => fileInputRef.current?.click()}>
          {children}
        </div>
      ) : (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
            ${dragOver ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'}
            ${uploading ? 'pointer-events-none opacity-50' : 'hover:border-primary hover:bg-primary/5'}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <AnimatePresence mode="wait">
            {uploading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                  <Progress value={progress} className="w-full max-w-xs mx-auto" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Drop files here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {type === 'avatar' && 'JPG, PNG, WEBP up to 5MB'}
                    {type === 'post' && 'Images, videos up to 10MB'}
                    {type === 'attachment' && 'Any file up to 25MB'}
                    {type === 'community' && 'JPG, PNG, WEBP up to 5MB'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
