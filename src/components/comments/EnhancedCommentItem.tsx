import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Comment, CommentReplyWithProfile } from '@/services/commentsService';
import { CommentLikeButton } from './CommentLikeButton';
import { CommentReplyButton } from './CommentReplyButton';
import { CommentRepliesList } from './CommentRepliesList';

interface EnhancedCommentItemProps {
  comment: Comment;
  onLikeChange?: (commentId: string, liked: boolean, likeCount: number) => void;
  onReplyAdded?: (commentId: string, reply: CommentReplyWithProfile) => void;
  showReplies?: boolean;
  maxReplies?: number;
}

export const EnhancedCommentItem: React.FC<EnhancedCommentItemProps> = ({
  comment,
  onLikeChange,
  onReplyAdded,
  showReplies = true,
  maxReplies = 3
}) => {
  const [replies, setReplies] = useState<CommentReplyWithProfile[]>(comment.commentReplies || []);
  const [showAllReplies, setShowAllReplies] = useState(false);

  const handleLikeChange = (liked: boolean, likeCount: number) => {
    onLikeChange?.(comment.id, liked, likeCount);
  };

  const handleReplyAdded = (reply: CommentReplyWithProfile) => {
    setReplies(prev => [...prev, reply]);
    onReplyAdded?.(comment.id, reply);
  };

  return (
    <div className="flex gap-3 p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
          {comment.profiles.avatar_url ? (
            <img
              src={comment.profiles.avatar_url}
              alt={comment.profiles.display_name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {comment.profiles.display_name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Comment Content */}
      <div className="flex-1 min-w-0">
        {/* Comment Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {comment.profiles.display_name}
          </span>
          {comment.profiles.major && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              • {comment.profiles.major}
            </span>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Comment Text */}
        <div className="mb-2">
          <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>

        {/* Comment Actions */}
        <div className="flex items-center gap-4">
          <CommentLikeButton
            commentId={comment.id}
            initialLiked={comment.isLiked || false}
            initialLikeCount={comment.likes_count}
            onLikeChange={handleLikeChange}
            size="sm"
          />
          
          <CommentReplyButton
            commentId={comment.id}
            onReplyAdded={handleReplyAdded}
            size="sm"
          />
        </div>

        {/* Replies */}
        {showReplies && replies.length > 0 && (
          <CommentRepliesList
            replies={replies}
            onReplyAdded={handleReplyAdded}
            showAll={showAllReplies}
            maxReplies={maxReplies}
          />
        )}

        {/* Show More Replies Button */}
        {showReplies && comment.reply_count > maxReplies && !showAllReplies && (
          <div className="mt-2">
            <button
              onClick={() => setShowAllReplies(true)}
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              View all {comment.reply_count} replies
            </button>
          </div>
        )}
      </div>
    </div>
  );
};





















