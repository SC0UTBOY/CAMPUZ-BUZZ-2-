import { supabase } from '@/integrations/supabase/client';

export interface ImageUploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
}

export class CompleteImageUploadService {
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

  // Generate unique filename with user folder structure
  static generateFileName(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Structure: userId/timestamp_random_filename.ext
    return `${userId}/${timestamp}_${randomString}_${sanitizedName}.${extension}`;
  }

  // Upload image to Supabase Storage
  static async uploadImage(file: File): Promise<ImageUploadResult> {
    try {
      console.log('🚀 Starting image upload:', file.name, file.size, file.type);
      
      // 1. Validate file
      const validation = this.validateImage(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // 2. Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('❌ Auth error:', userError);
        throw new Error('Authentication failed. Please log in again.');
      }
      if (!user) {
        throw new Error('User not authenticated. Please log in.');
      }

      console.log('✅ User authenticated:', user.id);

      // 3. Generate unique filename
      const fileName = this.generateFileName(file.name, user.id);
      console.log('📝 Generated filename:', fileName);

      // 4. Check if bucket exists
      await this.checkBucketExists();

      // 5. Upload file to Supabase Storage
      console.log('📤 Uploading to bucket:', this.BUCKET_NAME);
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false, // Don't overwrite existing files
          contentType: file.type
        });

      if (error) {
        console.error('❌ Upload error:', error);
        
        // Handle specific error cases
        if (error.message.includes('Bucket not found')) {
          throw new Error('Storage bucket "post-images" not found. Please create it in your Supabase dashboard: Storage → Create bucket → Name: "post-images" → Public: Yes');
        }
        if (error.message.includes('policy')) {
          throw new Error('Permission denied. Please check your storage RLS policies.');
        }
        if (error.message.includes('already exists')) {
          throw new Error('A file with this name already exists. Please try again.');
        }
        if (error.message.includes('size')) {
          throw new Error('File too large. Please upload images smaller than 10MB.');
        }
        
        throw new Error(`Upload failed: ${error.message}`);
      }

      console.log('✅ Upload successful:', data);

      // 6. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      console.log('🔗 Public URL generated:', publicUrl);

      // 7. Verify URL is valid
      if (!publicUrl || !publicUrl.includes(fileName)) {
        throw new Error('Failed to generate public URL for uploaded image');
      }

      const result: ImageUploadResult = {
        url: publicUrl,
        path: fileName,
        size: file.size,
        type: file.type
      };

      console.log('🎉 Upload complete:', result);
      return result;
      
    } catch (error) {
      console.error('💥 Image upload error:', error);
      throw error instanceof Error ? error : new Error('Unknown upload error');
    }
  }

  // Check if storage bucket exists
  private static async checkBucketExists(): Promise<void> {
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('❌ Error listing buckets:', listError);
        throw new Error('Cannot access storage. Please check your Supabase configuration.');
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);

      if (!bucketExists) {
        throw new Error(`Storage bucket '${this.BUCKET_NAME}' not found. Please create it in your Supabase dashboard: Storage → Create bucket → Name: '${this.BUCKET_NAME}' → Public: Yes`);
      }
      
      console.log('✅ Storage bucket exists and is ready');
    } catch (error) {
      console.error('❌ Bucket check failed:', error);
      throw error;
    }
  }

  // Delete image from storage
  static async deleteImage(path: string): Promise<void> {
    try {
      console.log('🗑️ Deleting image:', path);
      
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([path]);

      if (error) {
        console.error('❌ Delete error:', error);
        throw new Error(`Delete failed: ${error.message}`);
      }
      
      console.log('✅ Image deleted successfully');
    } catch (error) {
      console.error('💥 Image delete error:', error);
      throw error;
    }
  }

  // Get public URL for existing image
  static getPublicUrl(path: string): string {
    const { data: { publicUrl } } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(path);
    
    return publicUrl;
  }

  // List user's images
  static async listUserImages(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(userId);

      if (error) {
        throw new Error(`Failed to list images: ${error.message}`);
      }

      return data?.map(file => `${userId}/${file.name}`) || [];
    } catch (error) {
      console.error('Error listing images:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const completeImageUploadService = CompleteImageUploadService;
