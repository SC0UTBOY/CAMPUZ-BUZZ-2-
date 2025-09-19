
import React, { useState, useEffect } from 'react';
import { OptimizedImage } from './OptimizedImage';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface PostImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export const PostImage: React.FC<PostImageProps> = ({
  src,
  alt,
  className = "w-full max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity",
  fallbackClassName = "w-full h-48 bg-muted flex items-center justify-center text-muted-foreground"
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset error state when src changes
  useEffect(() => {
    if (src) {
      setHasError(false);
      setIsLoading(true);
    }
  }, [src]);

  // Early return if no src provided
  if (!src || hasError) {
    return (
      <div className={fallbackClassName}>
        <div className="flex flex-col items-center gap-2">
          <ImageIcon className="h-8 w-8" />
          <span className="text-sm">
            {hasError ? 'Failed to load image' : 'No image available'}
          </span>
        </div>
      </div>
    );
  }

  const handleError = () => {
    console.error('Failed to load image:', src);
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className={fallbackClassName}>
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-sm">Loading image...</span>
          </div>
        </div>
      )}
      <OptimizedImage
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
        fallbackSrc="/placeholder.svg"
      />
    </div>
  );
};
