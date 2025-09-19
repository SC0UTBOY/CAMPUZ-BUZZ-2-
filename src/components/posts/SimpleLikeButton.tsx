import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleLikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
  showCount?: boolean;
  className?: string;
}

/**
 * Simple like button for testing - without complex debouncing
 */
export const SimpleLikeButton: React.FC<SimpleLikeButtonProps> = ({
  postId,
  initialLiked,
  initialCount,
  onLike,
  disabled = false,
  size = 'default',
  showCount = true,
  className
}) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleLikeClick = async () => {
    if (disabled || isLoading) return;

    const newLikedState = !isLiked;
    
    // Optimistic update
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    setIsLoading(true);

    try {
      await onLike(postId, newLikedState);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      setIsLiked(!newLikedState);
      setLikeCount(prev => newLikedState ? prev - 1 : prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLikeClick();
    }
  };

  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    default: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleLikeClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || isLoading}
      className={cn(
        sizeClasses[size],
        'flex items-center space-x-1 transition-all duration-200',
        'hover:bg-red-50 dark:hover:bg-red-950/20',
        'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
        isLiked && 'text-red-500 hover:text-red-600',
        !isLiked && 'text-muted-foreground hover:text-red-500',
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
      role="button"
      tabIndex={0}
      aria-label={isLiked ? 'Unlike this post' : 'Like this post'}
      aria-pressed={isLiked}
    >
      <Heart 
        className={cn(
          iconSizes[size],
          'transition-all duration-200',
          isLiked && 'fill-current',
          isLoading && 'animate-pulse'
        )}
      />
      {showCount && (
        <span className={cn(
          'font-medium transition-colors duration-200',
          isLiked && 'text-red-500',
          !isLiked && 'text-muted-foreground'
        )}>
          {likeCount}
        </span>
      )}
      {isLoading && (
        <div className="ml-1">
          <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
        </div>
      )}
    </Button>
  );
};

export default SimpleLikeButton;









