
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Shield, AlertTriangle } from 'lucide-react';
import { enhancedSecureUpload, SecureUploadOptions } from '@/utils/secureFileUpload';
import { useToast } from '@/hooks/use-toast';

interface SecureFileUploaderProps {
  onUploadComplete: (url: string) => void;
  uploadOptions: SecureUploadOptions;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export const SecureFileUploader: React.FC<SecureFileUploaderProps> = ({
  onUploadComplete,
  uploadOptions,
  accept = { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
  maxFiles = 1,
  disabled = false,
  className = ''
}) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [securityCheck, setSecurityCheck] = useState<'pending' | 'passed' | 'failed'>('pending');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setUploadProgress(0);
    setSecurityCheck('pending');

    try {
      // Simulate security check progress
      setUploadProgress(20);
      setSecurityCheck('pending');
      
      // Small delay to show security check in progress
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUploadProgress(40);
      
      const result = await enhancedSecureUpload(file, uploadOptions);
      
      setUploadProgress(80);
      
      if (result.success && result.url) {
        setSecurityCheck('passed');
        setUploadProgress(100);
        onUploadComplete(result.url);
        
        toast({
          title: 'Upload successful',
          description: 'File has been securely uploaded and verified.'
        });
      } else {
        setSecurityCheck('failed');
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      setSecurityCheck('failed');
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      
      // Reset security check after a delay
      setTimeout(() => setSecurityCheck('pending'), 3000);
    }
  }, [uploadOptions, onUploadComplete, toast]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    disabled: disabled || uploading,
    maxSize: uploadOptions.maxSizeBytes || 10 * 1024 * 1024 // 10MB default
  });

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-border/60'}
          ${disabled || uploading ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          
          {isDragActive ? (
            <p className="text-primary">Drop the file here...</p>
          ) : (
            <div>
              <p className="text-muted-foreground">
                Drag & drop a file here, or click to select
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Max size: {Math.round((uploadOptions.maxSizeBytes || 10 * 1024 * 1024) / 1024 / 1024)}MB
              </p>
            </div>
          )}
        </div>
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading and verifying...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
          
          <div className="flex items-center space-x-2 text-sm">
            <Shield className={`h-4 w-4 ${
              securityCheck === 'pending' ? 'text-blue-500 animate-pulse' :
              securityCheck === 'passed' ? 'text-green-500' :
              'text-red-500'
            }`} />
            <span className={
              securityCheck === 'pending' ? 'text-blue-600' :
              securityCheck === 'passed' ? 'text-green-600' :
              'text-red-600'
            }>
              {securityCheck === 'pending' && 'Running security checks...'}
              {securityCheck === 'passed' && 'Security verification passed'}
              {securityCheck === 'failed' && 'Security verification failed'}
            </span>
          </div>
        </div>
      )}

      {fileRejections.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {fileRejections[0].errors[0].message}
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Files are automatically scanned for security threats and validated before upload.
          Only safe, verified files are accepted.
        </AlertDescription>
      </Alert>
    </div>
  );
};
