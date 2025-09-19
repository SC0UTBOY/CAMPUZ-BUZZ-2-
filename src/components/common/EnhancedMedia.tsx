
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Play, Pause, Volume2, VolumeX, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mediaService } from '@/services/mediaService';

interface EnhancedMediaProps {
  src: string;
  alt: string;
  type?: 'image' | 'video' | 'auto';
  className?: string;
  fallbackSrc?: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
  controls?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  placeholder?: React.ReactNode;
}

export const EnhancedMedia: React.FC<EnhancedMediaProps> = ({
  src,
  alt,
  type = 'auto',
  className,
  fallbackSrc,
  width,
  height,
  lazy = true,
  onLoad,
  onError,
  controls = true,
  autoplay = false,
  muted = true,
  loop = false,
  placeholder
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(!lazy);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (elementRef.current) {
      observerRef.current.observe(elementRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [lazy, isInView]);

  // Determine media type and set source
  useEffect(() => {
    if (!isInView || !src) return;

    const optimizedSrc = mediaService.getOptimizedUrl(src, width, height);
    
    if (!mediaService.isValidUrl(optimizedSrc)) {
      setHasError(true);
      onError?.('Invalid media URL');
      return;
    }

    if (type === 'auto') {
      // Detect media type from URL or file extension
      const isVideo = /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(optimizedSrc) || 
                     optimizedSrc.includes('video/');
      setMediaType(isVideo ? 'video' : 'image');
    } else {
      setMediaType(type);
    }

    setCurrentSrc(optimizedSrc);
  }, [src, isInView, type, width, height]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      setHasError(true);
      onError?.('Failed to load media');
    }
  }, [currentSrc, fallbackSrc, onError]);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleMuteToggle = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const renderErrorState = () => (
    <div className={cn(
      "flex items-center justify-center bg-muted text-muted-foreground",
      className
    )}>
      <div className="text-center p-4">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Failed to load media</p>
      </div>
    </div>
  );

  const renderPlaceholder = () => (
    <div className={cn(
      "flex items-center justify-center bg-muted animate-pulse",
      className
    )}>
      {placeholder || (
        <div className="text-center p-4">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      )}
    </div>
  );

  if (hasError) {
    return renderErrorState();
  }

  if (!isInView || !currentSrc) {
    return <div ref={elementRef}>{renderPlaceholder()}</div>;
  }

  if (mediaType === 'video') {
    return (
      <div ref={elementRef} className={cn("relative group", className)}>
        <video
          ref={videoRef}
          src={currentSrc}
          className="w-full h-full object-cover"
          onLoadedData={handleLoad}
          onError={handleError}
          autoPlay={autoplay}
          muted={muted}
          loop={loop}
          playsInline
          preload={lazy ? "none" : "metadata"}
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />

        {!isLoaded && renderPlaceholder()}

        {/* Video Controls */}
        {controls && isLoaded && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded px-2 py-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayPause}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMuteToggle}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Render image
  return (
    <div ref={elementRef} className={cn("relative", className)}>
      <img
        src={currentSrc}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-300"
        onLoad={handleLoad}
        onError={handleError}
        loading={lazy ? "lazy" : "eager"}
        style={{
          opacity: isLoaded ? 1 : 0
        }}
        width={width}
        height={height}
      />
      
      {!isLoaded && renderPlaceholder()}
    </div>
  );
};
