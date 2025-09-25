import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, File, Image, Video, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { EnhancedCard } from '@/components/ui/enhanced-card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { fileUploadService, type FileUploadType, type UploadResult } from '@/services/fileUploadService';
import { useAuth } from '@/contexts/AuthContext';

interface UploadFile {
  file: File;
  id: string;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  result?: UploadResult;
}

interface FileUploadManagerProps {
  type: FileUploadType;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  accept?: string;
  onFilesUploaded: (results: UploadResult[]) => void;
  onProgressChange?: (progress: number) => void;
  className?: string;
}

export const FileUploadManager: React.FC<FileUploadManagerProps> = ({
  type,
  multiple = false,
  maxFiles = 1,
  maxSize = 10,
  accept,
  onFilesUploaded,
  onProgressChange,
  className = ''
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const generateFileId = () => Math.random().toString(36).substr(2, 9);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type.startsWith('video/')) return Video;
    if (file.type.includes('pdf') || file.type.includes('document')) return FileText;
    return File;
  };

  const createFilePreview = useCallback((file: File): string | undefined => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return undefined;
  }, []);

  const validateFile = (file: File): string | null => {
    const validation = fileUploadService.validateFile(file, type);
    return validation.valid ? null : validation.error || 'Invalid file';
  };

  const handleFileSelect = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles || !user) return;

    const newFiles: UploadFile[] = [];
    const remainingSlots = maxFiles - files.length;
    const filesToProcess = Array.from(selectedFiles).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      const error = validateFile(file);
      const uploadFile: UploadFile = {
        file,
        id: generateFileId(),
        preview: createFilePreview(file),
        progress: 0,
        status: error ? 'error' : 'pending',
        error
      };
      
      newFiles.push(uploadFile);
    }

    setFiles(prev => [...prev, ...newFiles]);

    // Start uploading valid files
    for (const uploadFile of newFiles) {
      if (uploadFile.status !== 'error') {
        await uploadFile_(uploadFile);
      }
    }
  }, [files, maxFiles, user, maxSize, accept, createFilePreview]);

  const uploadFile_ = async (uploadFile: UploadFile) => {
    if (!user) return;

    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id ? { ...f, status: 'uploading' as const } : f
    ));

    try {
      const result = await fileUploadService.uploadFile(
        uploadFile.file,
        type,
        user.id,
        (progress) => {
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, progress } : f
          ));
          
          // Calculate overall progress
          setFiles(currentFiles => {
            const totalProgress = currentFiles.reduce((sum, f) => sum + f.progress, 0);
            onProgressChange?.(totalProgress / currentFiles.length);
            return currentFiles;
          });
        }
      );

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'completed' as const, result, progress: 100 }
          : f
      ));

      // Notify parent of completed uploads
      setFiles(currentFiles => {
        const completedResults = currentFiles
          .filter(f => f.status === 'completed' && f.result)
          .map(f => f.result!);
        
        if (completedResults.length > 0) {
          onFilesUploaded(completedResults);
        }
        
        return currentFiles;
      });

      toast({
        title: 'Upload successful',
        description: `${uploadFile.file.name} uploaded successfully`
      });

    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'error' as const, 
              error: error instanceof Error ? error.message : 'Upload failed' 
            } 
          : f
      ));
      
      toast({
        title: 'Upload failed',
        description: `Failed to upload ${uploadFile.file.name}`,
        variant: 'destructive'
      });
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const retryUpload = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      uploadFile_(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const triggerFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept || '';
    input.multiple = multiple;
    input.onchange = (e) => {
      handleFileSelect((e.target as HTMLInputElement).files);
    };
    input.click();
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <EnhancedCard
        variant="glass"
        className={`
          border-2 border-dashed cursor-pointer transition-all duration-300
          ${isDragOver ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-muted-foreground/25'}
          hover:border-primary hover:bg-primary/5
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={triggerFileSelect}
      >
        <div className="p-8 text-center">
          <motion.div
            animate={{ scale: isDragOver ? 1.1 : 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          </motion.div>
          <h3 className="text-lg font-semibold mb-2">
            {isDragOver ? 'Drop files here' : 'Upload files'}
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            Drop files here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Max {maxFiles} file{maxFiles > 1 ? 's' : ''}, up to {maxSize}MB each
          </p>
        </div>
      </EnhancedCard>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          <AnimatePresence>
            {files.map((uploadFile) => {
              const IconComponent = getFileIcon(uploadFile.file);
              return (
                <motion.div
                  key={uploadFile.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 border rounded-lg bg-background"
                >
                  <div className="flex items-center space-x-3">
                    {/* File Preview/Icon */}
                    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                      {uploadFile.preview ? (
                        <img 
                          src={uploadFile.preview} 
                          alt={uploadFile.file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <IconComponent className="h-6 w-6 text-muted-foreground" />
                      )}
                      
                      {/* Status Overlay */}
                      {uploadFile.status === 'uploading' && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                        </div>
                      )}
                      
                      {uploadFile.status === 'completed' && (
                        <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                      
                      {uploadFile.status === 'error' && (
                        <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{uploadFile.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadFile.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      
                      {/* Progress Bar */}
                      {uploadFile.status === 'uploading' && (
                        <div className="mt-2">
                          <Progress value={uploadFile.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {uploadFile.progress}% uploaded
                          </p>
                        </div>
                      )}
                      
                      {/* Error Message */}
                      {uploadFile.status === 'error' && uploadFile.error && (
                        <p className="text-sm text-red-500 mt-1">{uploadFile.error}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {uploadFile.status === 'error' && (
                        <EnhancedButton
                          size="sm"
                          variant="outline"
                          onClick={() => retryUpload(uploadFile.id)}
                        >
                          Retry
                        </EnhancedButton>
                      )}
                      
                      <EnhancedButton
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(uploadFile.id)}
                      >
                        <X className="h-4 w-4" />
                      </EnhancedButton>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
