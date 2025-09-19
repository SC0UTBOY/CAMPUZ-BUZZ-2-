import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { likesService, LikeResult } from '@/services/likesService';
import { useToast } from '@/hooks/use-toast';

interface PerfectLikeButtonProps {
  postId: string;
  initialLiked?: boolean;
  initialCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  disabled?: boolean;
  onLikeChange?: (result: LikeResult) => void;
}

export const PerfectLikeButton: React.FC<PerfectLikeButtonProps> = ({
  postId,
  initialLiked = false,
  initialCount = 0,
  size = 'md',
  showCount = true,
  disabled = false,
  onLikeChange
}) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Update state when props change
  useEffect(() => {
    setIsLiked(initialLiked);
    setLikeCount(initialCount);
  }, [initialLiked, initialCount]);

  const handleClick = async () => {
    if (disabled || isLoading) return;

    // Store previous state for rollback
    const previousLiked = isLiked;
    const previousCount = likeCount;
    
    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);
    setIsLoading(true);

    try {
      const result = await likesService.toggleLike(postId);
      
      // Update with server response
      setIsLiked(result.isLiked);
      setLikeCount(result.likeCount);
      
      // Notify parent component
      onLikeChange?.(result);
      
      // Show success toast
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
        "transition-all duration-200 hover:scale-105",
        isLiked 
          ? "text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 border-red-200" 
          : "text-muted-foreground hover:text-red-500 hover:bg-red-50",
        isLoading && "opacity-50 cursor-not-allowed animate-pulse"
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
          "font-medium transition-all duration-200",
          isLiked && "text-red-600"
        )}>
          {likeCount}
        </span>
      )}
    </Button>
  );
};

// Hook for using the like button with state management
export const useLikeButton = (postId: string) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLikeStatus = async () => {
      try {
        setIsLoading(true);
        const [liked, count] = await Promise.all([
          likesService.checkUserLike(postId),
          likesService.getLikeCount(postId)
        ]);
        setIsLiked(liked);
        setLikeCount(count);
      } catch (error) {
        console.error('Error loading like status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLikeStatus();
  }, [postId]);

  const handleLikeChange = (result: LikeResult) => {
    setIsLiked(result.isLiked);
    setLikeCount(result.likeCount);
  };

  return {
    isLiked,
    likeCount,
    isLoading,
    handleLikeChange
  };
};
