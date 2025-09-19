import React, { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { CommentsService } from '@/services/commentsService';

interface CommentLikeButtonProps {
  commentId: string;
  initialLiked: boolean;
  initialLikeCount: number;
  onLikeChange?: (liked: boolean, likeCount: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const CommentLikeButton: React.FC<CommentLikeButtonProps> = ({
  commentId,
  initialLiked,
  initialLikeCount,
  onLikeChange,
  size = 'sm',
  disabled = false
}) => {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (loading || disabled) return;

    setLoading(true);
    try {
      const result = await CommentsService.toggleCommentLike(commentId);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
      onLikeChange?.(result.liked, result.likeCount);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'h-4 w-4 text-sm',
    md: 'h-5 w-5 text-base',
    lg: 'h-6 w-6 text-lg'
  };

  const buttonClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading || disabled}
      className={`
        flex items-center gap-1 rounded-full transition-colors
        ${buttonClasses[size]}
        ${liked 
          ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {loading ? (
        <Loader2 className={`${sizeClasses[size]} animate-spin`} />
      ) : (
        <Heart 
          className={`${sizeClasses[size]} ${liked ? 'fill-current' : ''}`} 
        />
      )}
      <span className="font-medium">{likeCount}</span>
    </button>
  );
};









