
import { supabase } from '@/integrations/supabase/client';

export interface MediaValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: string;
  size?: number;
}

export interface MediaUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

class MediaService {
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  private readonly ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

  validateFile(file: File): MediaValidationResult {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds 50MB limit. Current size: ${Math.round(file.size / 1024 / 1024)}MB`
      };
    }

    // Check file type
    const isValidImage = this.ALLOWED_IMAGE_TYPES.includes(file.type);
    const isValidVideo = this.ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isValidImage && !isValidVideo) {
      return {
        isValid: false,
        error: `Unsupported file type: ${file.type}`
      };
    }

    return {
      isValid: true,
      fileType: isValidImage ? 'image' : 'video',
      size: file.size
    };
  }

  async uploadMedia(
    file: File,
    bucket: 'avatars' | 'posts' | 'attachments' | 'communities',
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<MediaUploadResult> {
    try {
      // Validate file first
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${userId}/${timestamp}_${randomString}.${fileExtension}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return { success: false, error: `Upload failed: ${error.message}` };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      if (onProgress) {
        onProgress(100);
      }

      return { success: true, url: urlData.publicUrl };

    } catch (error) {
      console.error('Media upload error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown upload error' 
      };
    }
  }

  async deleteMedia(url: string, bucket: 'avatars' | 'posts' | 'attachments' | 'communities'): Promise<boolean> {
    try {
      // Extract file path from URL
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === bucket);
      
      if (bucketIndex === -1) {
        console.error('Invalid file URL for deletion');
        return false;
      }
      
      const filePath = urlParts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Media deletion error:', error);
      return false;
    }
  }

  getOptimizedUrl(url: string, width?: number, height?: number): string {
    if (!url) return '';
    
    // If it's a Supabase storage URL, we can add transform parameters
    if (url.includes('supabase.co/storage/v1/object/public/')) {
      const params = new URLSearchParams();
      if (width) params.append('width', width.toString());
      if (height) params.append('height', height.toString());
      params.append('format', 'webp');
      
      return params.toString() ? `${url}?${params.toString()}` : url;
    }
    
    return url;
  }

  /**
   * Resolve a storage path or partial URL to a public URL
   * Examples accepted:
   *  - posts/user/file.jpg
   *  - /storage/v1/object/public/posts/user/file.jpg
   *  - https://<proj>.supabase.co/storage/v1/object/public/posts/user/file.jpg
   */
  resolvePublicUrl(pathOrUrl: string, bucketHint: 'avatars' | 'posts' | 'attachments' | 'communities' = 'posts'): string {
    if (!pathOrUrl) return '';

    // Already a full public URL
    if (this.isValidUrl(pathOrUrl) && pathOrUrl.includes('/storage/v1/object/public/')) {
      return pathOrUrl;
    }

    // Strip any leading slashes
    const clean = pathOrUrl.replace(/^\/+/, '');

    // If it already contains the bucket name at the start, use as path
    const path = clean.startsWith(`${bucketHint}/`) ? clean.replace(`${bucketHint}/`, '') : clean;

    const { data } = supabase.storage.from(bucketHint).getPublicUrl(path);
    return data.publicUrl;
  }

  isValidUrl(url: string): boolean {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export const mediaService = new MediaService();
