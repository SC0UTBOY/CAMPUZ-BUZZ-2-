import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FixedLikeButtonProps {
  postId: string;
  initialLiked?: boolean;
  initialCount?: number;
  onLike: (postId: string) => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  disabled?: boolean;
}

export const FixedLikeButton: React.FC<FixedLikeButtonProps> = ({
  postId,
  initialLiked = false,
  initialCount = 0,
  onLike,
  size = 'md',
  showCount = true,
  disabled = false
}) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  // Update state when props change
  useEffect(() => {
    setIsLiked(initialLiked);
    setLikeCount(initialCount);
  }, [initialLiked, initialCount]);

  const handleClick = async () => {
    if (disabled || isLoading) return;

    // Optimistic update
    const previousLiked = isLiked;
    const previousCount = likeCount;
    
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    setIsLoading(true);

    try {
      await onLike(postId);
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      console.error('Like button error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        sizeClasses[size],
        "transition-all duration-200",
        isLiked 
          ? "text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100" 
          : "text-muted-foreground hover:text-red-500 hover:bg-red-50",
        isLoading && "opacity-50 cursor-not-allowed"
      )}
    >
      <Heart 
        className={cn(
          iconSizes[size],
          "mr-1 transition-all duration-200",
          isLiked && "fill-current",
          isLoading && "animate-pulse"
        )} 
      />
      {showCount && (
        <span className="font-medium">
          {likeCount}
        </span>
      )}
    </Button>
  );
};
