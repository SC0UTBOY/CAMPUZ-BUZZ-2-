
import React from 'react';
import { motion } from 'framer-motion';
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface OptimisticUploadPreviewProps {
  files: UploadFile[];
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
}

export const OptimisticUploadPreview: React.FC<OptimisticUploadPreviewProps> = ({
  files,
  onRemove,
  onRetry
}) => {
  if (files.length === 0) return null;

  return (
    <div className="space-y-3">
      {files.map((uploadFile) => (
        <motion.div
          key={uploadFile.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative bg-card border rounded-lg p-3"
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
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
              
              {/* Status Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                {uploadFile.status === 'uploading' && (
                  <div className="bg-black/50 rounded-full p-1">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  </div>
                )}
                
                {uploadFile.status === 'completed' && (
                  <div className="bg-green-500 rounded-full p-1">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}
                
                {uploadFile.status === 'error' && (
                  <div className="bg-red-500 rounded-full p-1">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{uploadFile.file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(uploadFile.file.size / 1024 / 1024).toFixed(1)} MB
              </p>
              
              {/* Progress Bar */}
              {uploadFile.status === 'uploading' && (
                <div className="mt-2">
                  <Progress value={uploadFile.progress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {uploadFile.progress}% uploaded
                  </p>
                </div>
              )}
              
              {/* Error Message */}
              {uploadFile.status === 'error' && uploadFile.error && (
                <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
              )}
              
              {/* Success Message */}
              {uploadFile.status === 'completed' && (
                <p className="text-xs text-green-600 mt-1">Upload successful</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1">
              {uploadFile.status === 'error' && onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRetry(uploadFile.id)}
                  className="h-8 px-2 text-xs"
                >
                  Retry
                </Button>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemove(uploadFile.id)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
