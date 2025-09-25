
import { useState, useCallback } from 'react';

interface ImageOptimizationOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export const useImageOptimization = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const optimizeImage = useCallback(async (
    file: File, 
    options: ImageOptimizationOptions = {}
  ): Promise<File> => {
    const {
      quality = 0.8,
      maxWidth = 1200,
      maxHeight = 800,
      format = 'webp'
    } = options;

    setIsProcessing(true);

    try {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const optimizedFile = new File([blob], file.name, {
                  type: `image/${format}`,
                  lastModified: Date.now()
                });
                resolve(optimizedFile);
              } else {
                reject(new Error('Failed to optimize image'));
              }
            },
            `image/${format}`,
            quality
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const createThumbnail = useCallback(async (
    file: File,
    size: number = 150
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = size;
        canvas.height = size;

        // Calculate crop area for square thumbnail
        const { width, height } = img;
        const cropSize = Math.min(width, height);
        const startX = (width - cropSize) / 2;
        const startY = (height - cropSize) / 2;

        ctx?.drawImage(
          img,
          startX, startY, cropSize, cropSize,
          0, 0, size, size
        );

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.onerror = () => reject(new Error('Failed to create thumbnail'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  return {
    optimizeImage,
    createThumbnail,
    isProcessing
  };
};
