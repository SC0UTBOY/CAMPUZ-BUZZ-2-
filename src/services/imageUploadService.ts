import { supabase } from '@/integrations/supabase/client';

export interface ImageUploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
}

export class ImageUploadService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  private static readonly BUCKET_NAME = 'post-images';

  // Validate image file
  static validateImage(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.' 
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: 'File too large. Please upload images smaller than 10MB.' 
      };
    }

    return { valid: true };
  }

  // Generate unique filename
  static generateFileName(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `${userId}/${timestamp}_${randomString}_${sanitizedName}.${extension}`;
  }

  // Upload image to Supabase Storage
  static async uploadImage(file: File): Promise<ImageUploadResult> {
    try {
      console.log('Starting image upload:', file.name, file.size, file.type);
      
      // Validate file
      const validation = this.validateImage(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
        throw new Error('Authentication failed');
      }
      if (!user) {
        throw new Error('User not authenticated. Please log in.');
      }

      console.log('User authenticated:', user.id);

      // Generate unique filename with user folder structure
      const fileName = this.generateFileName(file.name, user.id);
      console.log('Generated filename:', fileName);

      // Check if bucket exists
      await this.checkBucketExists();

      // Upload file with proper options
      console.log('Uploading to bucket:', this.BUCKET_NAME);
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false, // Don't overwrite existing files
          contentType: file.type
        });

      if (error) {
        console.error('Upload error details:', error);
        
        // Handle specific error cases
        if (error.message.includes('Bucket not found')) {
          throw new Error('Storage bucket "post-images" not found. Please create it in your Supabase dashboard.');
        }
        if (error.message.includes('policy')) {
          throw new Error('Permission denied. Please check your storage policies.');
        }
        if (error.message.includes('already exists')) {
          throw new Error('A file with this name already exists. Please try again.');
        }
        
        throw new Error(`Upload failed: ${error.message}`);
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      console.log('Public URL generated:', publicUrl);

      // Verify the URL is accessible
      if (!publicUrl || !publicUrl.includes(fileName)) {
        throw new Error('Failed to generate public URL for uploaded image');
      }

      const result: ImageUploadResult = {
        url: publicUrl,
        path: fileName,
        size: file.size,
        type: file.type
      };

      console.log('Upload result:', result);
      return result;
      
    } catch (error) {
      console.error('Image upload error:', error);
      throw error instanceof Error ? error : new Error('Unknown upload error');
    }
  }

  // Check if storage bucket exists (don't create - requires admin privileges)
  private static async checkBucketExists(): Promise<void> {
    try {
      // Try to get bucket info
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        throw new Error('Cannot access storage. Please check your Supabase configuration.');
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);

      if (!bucketExists) {
        throw new Error(`Storage bucket '${this.BUCKET_NAME}' not found. Please create it in your Supabase dashboard: Storage → Create bucket → Name: '${this.BUCKET_NAME}' → Public: Yes`);
      }
      
      console.log('Storage bucket exists and is ready');
    } catch (error) {
      console.error('Bucket check failed:', error);
      throw error;
    }
  }

  // Delete image from storage
  static async deleteImage(path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([path]);

      if (error) {
        console.error('Delete error:', error);
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Image delete error:', error);
      throw error;
    }
  }

  // Compress image before upload (optional)
  static async compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const width = img.width * ratio;
        const height = img.height * ratio;

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Image load failed'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Create image preview URL
  static createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  // Revoke preview URL to free memory
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}

export const imageUploadService = ImageUploadService;
