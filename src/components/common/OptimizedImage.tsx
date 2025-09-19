
import React, { useState, useEffect } from 'react';
import { EnhancedMedia } from './EnhancedMedia';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  placeholder?: string;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  width?: number;
  height?: number;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  fallbackSrc = '/placeholder.svg',
  placeholder,
  priority = false,
  onLoad,
  onError,
  width,
  height
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    if (src !== currentSrc) {
      setCurrentSrc(src);
      setHasError(false);
    }
  }, [src, currentSrc]);

  // Validate and potentially transform Supabase URLs
  const getValidImageUrl = (url: string): string => {
    if (!url) return fallbackSrc;

    // Handle Supabase storage URLs
    if (url.includes('supabase.co/storage/v1/object/public/')) {
      return url;
    }

    // Handle relative URLs
    if (url.startsWith('/')) {
      return url;
    }

    // Handle data URLs
    if (url.startsWith('data:')) {
      return url;
    }

    // Handle blob URLs
    if (url.startsWith('blob:')) {
      return url;
    }

    // Validate other URLs
    try {
      new URL(url);
      return url;
    } catch {
      console.warn('Invalid image URL:', url);
      return fallbackSrc;
    }
  };

  const handleError = () => {
    console.error('Failed to load image:', currentSrc);
    setHasError(true);
    if (!hasError) {
      // Try fallback only once
      setCurrentSrc(fallbackSrc);
    }
    onError?.();
  };

  const handleLoad = () => {
    setHasError(false);
    onLoad?.();
  };

  const validSrc = getValidImageUrl(currentSrc);

  return (
    <EnhancedMedia
      src={validSrc}
      alt={alt}
      type="image"
      className={className}
      fallbackSrc={fallbackSrc}
      lazy={!priority}
      onLoad={handleLoad}
      onError={handleError}
      width={width}
      height={height}
    />
  );
};
