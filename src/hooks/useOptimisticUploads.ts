
import { useState, useCallback } from 'react';
import { fileUploadService } from '@/services/fileUploadService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  result?: any;
}

export const useOptimisticUploads = (type: 'avatar' | 'post' | 'attachment' | 'community') => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadFile[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const createPreview = useCallback((file: File): string | undefined => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return undefined;
  }, []);

  const addFiles = useCallback((newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map(file => ({
      id: generateId(),
      file,
      preview: createPreview(file),
      progress: 0,
      status: 'pending' as const
    }));

    setFiles(prev => [...prev, ...uploadFiles]);
    return uploadFiles;
  }, [createPreview]);

  const uploadFile = useCallback(async (uploadFile: UploadFile) => {
    if (!user) return;

    // Update status to uploading
    setFiles(prev => 
      prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading' as const }
          : f
      )
    );

    try {
      const result = await fileUploadService.uploadFile(
        uploadFile.file,
        type,
        user.id,
        (progress) => {
          setFiles(prev =>
            prev.map(f =>
              f.id === uploadFile.id
                ? { ...f, progress }
                : f
            )
          );
        }
      );

      // Update with result
      setFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'completed' as const, result, progress: 100 }
            : f
        )
      );

      toast({
        title: 'Upload successful',
        description: `${uploadFile.file.name} uploaded successfully`
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'error' as const, error: errorMessage }
            : f
        )
      );

      toast({
        title: 'Upload failed',
        description: `Failed to upload ${uploadFile.file.name}`,
        variant: 'destructive'
      });

      throw error;
    }
  }, [user, type, toast]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const retryUpload = useCallback((id: string) => {
    const file = files.find(f => f.id === id);
    if (file) {
      uploadFile(file);
    }
  }, [files, uploadFile]);

  const uploadAll = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');
    const results = await Promise.allSettled(
      pendingFiles.map(file => uploadFile(file))
    );
    
    return results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);
  }, [files, uploadFile]);

  const getCompletedFiles = useCallback(() => {
    return files
      .filter(f => f.status === 'completed' && f.result)
      .map(f => f.result);
  }, [files]);

  const clearFiles = useCallback(() => {
    // Clean up preview URLs
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
  }, [files]);

  return {
    files,
    addFiles,
    removeFile,
    retryUpload,
    uploadAll,
    getCompletedFiles,
    clearFiles,
    hasUploading: files.some(f => f.status === 'uploading'),
    hasCompleted: files.some(f => f.status === 'completed'),
    hasErrors: files.some(f => f.status === 'error')
  };
};
