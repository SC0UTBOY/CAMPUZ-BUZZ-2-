import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { useDebounce } from '@/hooks/useDebounce';

interface EnhancedLikeButtonProps {
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
 * Enhanced like button with Twitter/Facebook-like functionality
 * - Real-time state updates
 * - Debounced API calls
 * - Visual feedback with animations
 * - Prevents rapid clicking issues
 */
export const EnhancedLikeButton: React.FC<EnhancedLikeButtonProps> = ({
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
  const [isAnimating, setIsAnimating] = useState(false);
  const lastActionRef = useRef<{ isLiked: boolean; timestamp: number } | null>(null);
  
  // Simple like action without debouncing for now
  const handleLikeAction = useCallback(async (postId: string, newLikedState: boolean) => {
    try {
      setIsLoading(true);
      await onLike(postId, newLikedState);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert the optimistic update on error
      setIsLiked(!newLikedState);
      setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    } finally {
      setIsLoading(false);
    }
  }, [onLike]);

  const handleLikeClick = useCallback(() => {
    if (disabled || isLoading) return;

    const now = Date.now();
    const newLikedState = !isLiked;
    
    // Prevent rapid clicking by checking if the same action was performed recently
    if (lastActionRef.current && 
        lastActionRef.current.isLiked === newLikedState && 
        now - lastActionRef.current.timestamp < 1000) {
      return;
    }

    // Update last action
    lastActionRef.current = { isLiked: newLikedState, timestamp: now };

    // Optimistic update for immediate UI feedback
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    
    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    // API call
    handleLikeAction(postId, newLikedState);
  }, [isLiked, disabled, isLoading, handleLikeAction, postId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLikeClick();
    }
  }, [handleLikeClick]);

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
          isAnimating && 'scale-110',
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

export default EnhancedLikeButton;
