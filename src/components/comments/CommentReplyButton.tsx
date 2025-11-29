import React, { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { CommentsService, CommentReplyWithProfile } from '@/services/commentsService';

interface CommentReplyButtonProps {
  commentId: string;
  onReplyAdded?: (reply: CommentReplyWithProfile) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const CommentReplyButton: React.FC<CommentReplyButtonProps> = ({
  commentId,
  onReplyAdded,
  size = 'sm',
  disabled = false
}) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim() || loading || disabled) return;

    setLoading(true);
    try {
      const reply = await CommentsService.createCommentReply(commentId, replyText);
      setReplyText('');
      setShowReplyInput(false);
      onReplyAdded?.(reply);
    } catch (error) {
      console.error('Error creating reply:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReply();
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

  if (showReplyInput) {
    return (
      <div className="mt-2 space-y-2">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a reply..."
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              rows={2}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Press Enter to post, Shift+Enter for new line
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReply}
            disabled={!replyText.trim() || loading}
            className={`
              flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg
              hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors ${buttonClasses[size]}
            `}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Reply
          </button>
          <button
            onClick={() => {
              setShowReplyInput(false);
              setReplyText('');
            }}
            className="px-3 py-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowReplyInput(true)}
      disabled={disabled}
      className={`
        flex items-center gap-1 rounded-full transition-colors
        ${buttonClasses[size]}
        bg-gray-100 text-gray-600 hover:bg-gray-200 
        dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <MessageCircle className={sizeClasses[size]} />
      Reply
    </button>
  );
};





















