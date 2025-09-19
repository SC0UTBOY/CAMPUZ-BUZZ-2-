import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, File, Image, Video, FileText, Loader2 } from 'lucide-react';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { EnhancedCard } from '@/components/ui/enhanced-card';
import { useToast } from '@/hooks/use-toast';
import { fileUploadService, type FileUploadType, type UploadResult } from '@/services/fileUploadService';
import { useAuth } from '@/contexts/AuthContext';

interface FilePreview {
  file: File;
  preview?: string;
  uploading: boolean;
  progress: number;
  error?: string;
  result?: UploadResult;
}

interface EnhancedFileUploadProps {
  type: FileUploadType;
  multiple?: boolean;
  maxFiles?: number;
  onFilesUploaded: (results: UploadResult[]) => void;
  onFilesChanged?: (files: FilePreview[]) => void;
  accept?: string;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

export const EnhancedFileUpload: React.FC<EnhancedFileUploadProps> = ({
  type,
  multiple = false,
  maxFiles = 1,
  onFilesUploaded,
  onFilesChanged,
  accept,
  className = '',
  children,
  disabled = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type.startsWith('video/')) return Video;
    if (file.type.includes('pdf') || file.type.includes('document')) return FileText;
    return File;
  };

  const createPreview = useCallback((file: File): FilePreview => {
    const preview: FilePreview = {
      file,
      uploading: false,
      progress: 0
    };

    if (file.type.startsWith('image/')) {
      preview.preview = URL.createObjectURL(file);
    }

    return preview;
  }, []);

  const validateFile = (file: File): string | null => {
    const validation = fileUploadService.validateFile(file, type);
    return validation.valid ? null : validation.error || 'Invalid file';
  };

  const handleFileSelect = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles || !user || disabled) return;

    const newFiles: FilePreview[] = [];
    const filesToProcess = Array.from(selectedFiles).slice(0, maxFiles - files.length);

    for (const file of filesToProcess) {
      const error = validateFile(file);
      const filePreview = createPreview(file);
      
      if (error) {
        filePreview.error = error;
        toast({
          title: 'Invalid file',
          description: error,
          variant: 'destructive'
        });
      }
      
      newFiles.push(filePreview);
    }

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChanged?.(updatedFiles);

    // Start uploading valid files
    for (let i = 0; i < newFiles.length; i++) {
      const filePreview = newFiles[i];
      if (!filePreview.error) {
        await uploadFile(files.length + i, filePreview);
      }
    }
  }, [files, maxFiles, user, disabled, type, toast, onFilesChanged, createPreview]);

  const uploadFile = async (index: number, filePreview: FilePreview) => {
    if (!user) return;

    setFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, uploading: true, progress: 0 } : f
    ));

    try {
      const result = await fileUploadService.uploadFile(
        filePreview.file,
        type,
        user.id,
        (progress) => {
          setFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, progress } : f
          ));
        }
      );

      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, uploading: false, result, progress: 100 } : f
      ));

      const completedResults = files
        .map(f => f.result)
        .filter(Boolean) as UploadResult[];
      
      if (result) {
        completedResults.push(result);
        onFilesUploaded(completedResults);
      }

      toast({
        title: 'Upload successful',
        description: `${filePreview.file.name} uploaded successfully`
      });
    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, uploading: false, error: 'Upload failed' } : f
      ));
      
      toast({
        title: 'Upload failed',
        description: `Failed to upload ${filePreview.file.name}`,
        variant: 'destructive'
      });
    }
  };

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChanged?.(updatedFiles);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  if (children) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
        />
        <div onClick={() => !disabled && fileInputRef.current?.click()}>
          {children}
        </div>
        {files.length > 0 && (
          <FilePreviewGrid files={files} onRemove={removeFile} />
        )}
      </>
    );
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={disabled}
      />
      
      <EnhancedCard
        variant="glass"
        className={`
          border-2 border-dashed cursor-pointer transition-all duration-300
          ${isDragOver ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-muted-foreground/25'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
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
          <p className="text-sm text-muted-foreground mb-4">
            Drop files here or click to browse
          </p>
          <div className="text-xs text-muted-foreground">
            {type === 'avatar' && 'JPG, PNG, WEBP up to 5MB'}
            {type === 'post' && 'Images, videos up to 10MB'}
            {type === 'attachment' && 'Any file up to 25MB'}
            {type === 'community' && 'JPG, PNG, WEBP up to 5MB'}
          </div>
        </div>
      </EnhancedCard>

      {files.length > 0 && (
        <FilePreviewGrid files={files} onRemove={removeFile} />
      )}
    </div>
  );
};

interface FilePreviewGridProps {
  files: FilePreview[];
  onRemove: (index: number) => void;
}

const FilePreviewGrid: React.FC<FilePreviewGridProps> = ({ files, onRemove }) => {
  return (
    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <AnimatePresence>
        {files.map((filePreview, index) => (
          <motion.div
            key={`${filePreview.file.name}-${index}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative"
          >
            <EnhancedCard className="overflow-hidden">
              <div className="aspect-square relative">
                {filePreview.preview ? (
                  <img
                    src={filePreview.preview}
                    alt={filePreview.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    {React.createElement(getFileIcon(filePreview.file), {
                      className: "h-8 w-8 text-muted-foreground"
                    })}
                  </div>
                )}
                
                {filePreview.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-white mb-2" />
                      <div className="text-xs text-white">
                        {filePreview.progress}%
                      </div>
                    </div>
                  </div>
                )}

                {filePreview.error && (
                  <div className="absolute inset-0 bg-red-500/90 flex items-center justify-center">
                    <div className="text-center text-white text-xs p-2">
                      {filePreview.error}
                    </div>
                  </div>
                )}

                <EnhancedButton
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(index);
                  }}
                >
                  <X className="h-3 w-3" />
                </EnhancedButton>
              </div>
              
              <div className="p-2">
                <p className="text-xs font-medium truncate">
                  {filePreview.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(filePreview.file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </EnhancedCard>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const getFileIcon = (file: File) => {
  if (file.type.startsWith('image/')) return Image;
  if (file.type.startsWith('video/')) return Video;
  if (file.type.includes('pdf') || file.type.includes('document')) return FileText;
  return File;
};
