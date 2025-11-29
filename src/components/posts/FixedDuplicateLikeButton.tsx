import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { newPostsService } from '@/services/newPostsService';
import { useToast } from '@/hooks/use-toast';

interface FixedDuplicateLikeButtonProps {
  postId: string;
  initialLiked?: boolean;
  initialCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  disabled?: boolean;
  onLikeChange?: (isLiked: boolean, count: number) => void;
}

export const FixedDuplicateLikeButton: React.FC<FixedDuplicateLikeButtonProps> = ({
  postId,
  initialLiked = false,
  initialCount = 0,
  size = 'md',
  showCount = true,
  disabled = false,
  onLikeChange,
}) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Prevent double-clicks with ref
  const isProcessingRef = useRef(false);

  // Update state when props change
  useEffect(() => {
    setIsLiked(initialLiked);
    setLikeCount(initialCount);
  }, [initialLiked, initialCount]);

  const handleClick = async () => {
    // Prevent double-clicks and concurrent requests
    if (disabled || isLoading || isProcessingRef.current) {
      return;
    }

    // Set processing flag immediately
    isProcessingRef.current = true;
    setIsLoading(true);

    // Store previous state for rollback
    const previousLiked = isLiked;
    const previousCount = likeCount;
    
    // Optimistic update - show immediate feedback
    const newLiked = !isLiked;
    const newCount = newLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    
    setIsLiked(newLiked);
    setLikeCount(newCount);

    try {
      // Call the fixed toggle like service
      const result = await newPostsService.toggleLike(postId);
      
      // Update with server response (should match optimistic update)
      setIsLiked(result.isLiked);
      setLikeCount(result.likeCount);
      
      // Notify parent component
      onLikeChange?.(result.isLiked, result.likeCount);
      
      // Show success feedback
      toast({
        title: result.isLiked ? '❤️ Liked!' : '💔 Unliked',
        description: result.isLiked 
          ? 'You liked this post' 
          : 'You unliked this post',
        duration: 2000
      });
    } catch (error) {
      // Rollback optimistic update on error
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      
      console.error('Like button error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update like. Please try again.',
        variant: 'destructive',
        duration: 3000
      });
    } finally {
      setIsLoading(false);
      // Clear processing flag after a short delay to prevent rapid clicks
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 300);
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
        "transition-all duration-200 hover:scale-105 select-none",
        isLiked 
          ? "text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100" 
          : "text-muted-foreground hover:text-red-500 hover:bg-red-50",
        (isLoading || isProcessingRef.current) && "opacity-50 cursor-not-allowed"
      )}
    >
      <Heart 
        className={cn(
          iconSizes[size],
          showCount ? "mr-1" : "",
          "transition-all duration-200",
          isLiked && "fill-current scale-110",
          isLoading && "animate-pulse"
        )} 
      />
      {showCount && (
        <span className={cn(
          "font-medium transition-all duration-200 min-w-[1rem] text-center",
          isLiked && "text-red-600"
        )}>
          {likeCount}
        </span>
      )}
    </Button>
  );
};

// Hook for managing like state with duplicate prevention
export const useFixedLikeState = (postId: string, initialLiked = false, initialCount = 0) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleLikeChange = (liked: boolean, count: number) => {
    setIsLiked(liked);
    setLikeCount(count);
  };

  const toggleLike = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await newPostsService.toggleLike(postId);
      handleLikeChange(result.isLiked, result.likeCount);
      return result;
    } catch (error) {
      console.error('Toggle like error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLiked,
    likeCount,
    isLoading,
    toggleLike,
    handleLikeChange
  };
};
