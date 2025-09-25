
import { supabase } from '@/integrations/supabase/client';
import { mediaService } from './mediaService';

export interface UploadResult {
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  url: string;
}

export type FileUploadType = 'avatar' | 'post' | 'attachment' | 'community';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

class FileUploadService {
  private getBucketName(type: FileUploadType): string {
    switch (type) {
      case 'avatar':
        return 'avatars';
      case 'post':
        return 'posts';
      case 'attachment':
        return 'attachments';
      case 'community':
        return 'communities';
      default:
        return 'attachments';
    }
  }

  async uploadFile(
    file: File,
    type: FileUploadType,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    const bucketName = this.getBucketName(type);

    try {
      // Use the enhanced media service for upload
      const result = await mediaService.uploadMedia(file, bucketName as any, userId, onProgress);

      if (!result.success || !result.url) {
        throw new Error(result.error || 'Upload failed');
      }

      return {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type.split('/')[1],
        mimeType: file.type,
        url: result.url
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw error instanceof Error ? error : new Error('Unknown upload error');
    }
  }

  async deleteFile(url: string, type: FileUploadType): Promise<void> {
    const bucketName = this.getBucketName(type);
    
    const success = await mediaService.deleteMedia(url, bucketName as any);
    if (!success) {
      throw new Error('Failed to delete file');
    }
  }

  async uploadMultipleFiles(
    files: File[],
    type: FileUploadType,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      
      const fileProgress = (progress: number) => {
        const overallProgress = ((i / totalFiles) * 100) + (progress / totalFiles);
        onProgress?.(overallProgress);
      };

      try {
        const result = await this.uploadFile(file, type, userId, fileProgress);
        results.push(result);
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error);
        throw error;
      }
    }

    return results;
  }

  validateFile(file: File, type: FileUploadType): ValidationResult {
    // Use the media service for validation
    const validation = mediaService.validateFile(file);
    
    return {
      valid: validation.isValid,
      error: validation.error
    };
  }
}

export const fileUploadService = new FileUploadService();
