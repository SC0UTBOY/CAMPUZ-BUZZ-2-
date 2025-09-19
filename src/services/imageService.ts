
import { mediaService } from './mediaService';

export class ImageService {
  /**
   * Validates and normalizes image URLs
   */
  static validateImageUrl(url: string | null | undefined): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Handle empty strings
    if (url.trim() === '') {
      return null;
    }

    // Handle Supabase storage URLs
    if (url.includes('supabase.co/storage/v1/object/public/')) {
      return url;
    }

    // Handle relative URLs (convert to absolute if needed)
    if (url.startsWith('/')) {
      return url;
    }

    // Handle data URLs
    if (url.startsWith('data:image/')) {
      return url;
    }

    // Handle blob URLs
    if (url.startsWith('blob:')) {
      return url;
    }

    // Validate absolute URLs
    try {
      const parsedUrl = new URL(url);
      // Only allow http/https protocols for security
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        return url;
      }
      return null;
    } catch {
      console.warn('Invalid image URL format:', url);
      return null;
    }
  }

  /**
   * Gets an optimized version of the image URL if possible
   */
  static getOptimizedUrl(url: string, options?: { width?: number; height?: number }): string {
    const validUrl = this.validateImageUrl(url);
    if (!validUrl) {
      return '/placeholder.svg';
    }

    // Use media service optimization if available
    if (options?.width || options?.height) {
      return mediaService.getOptimizedUrl(validUrl, options.width, options.height);
    }

    return validUrl;
  }

  /**
   * Preloads an image to check if it can be loaded
   */
  static preloadImage(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const validUrl = this.validateImageUrl(url);
      if (!validUrl) {
        resolve(false);
        return;
      }

      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = validUrl;
    });
  }

  /**
   * Checks if a URL points to a supported image format
   */
  static isSupportedImageFormat(url: string): boolean {
    const validUrl = this.validateImageUrl(url);
    if (!validUrl) return false;

    const supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const lowercaseUrl = validUrl.toLowerCase();
    
    return supportedFormats.some(format => lowercaseUrl.includes(format));
  }
}

export const imageService = new ImageService();
