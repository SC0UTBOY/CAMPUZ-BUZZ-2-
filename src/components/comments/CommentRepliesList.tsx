import React from 'react';
import { CommentReplyWithProfile } from '@/services/commentsService';
import { formatDistanceToNow } from 'date-fns';

interface CommentRepliesListProps {
  replies: CommentReplyWithProfile[];
  onReplyAdded?: (reply: CommentReplyWithProfile) => void;
  showAll?: boolean;
  maxReplies?: number;
}

export const CommentRepliesList: React.FC<CommentRepliesListProps> = ({
  replies,
  onReplyAdded,
  showAll = false,
  maxReplies = 3
}) => {
  const displayReplies = showAll ? replies : replies.slice(0, maxReplies);
  const hasMoreReplies = !showAll && replies.length > maxReplies;

  if (replies.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="ml-4 border-l-2 border-gray-200 dark:border-gray-600 pl-4 space-y-2">
        {displayReplies.map((reply) => (
          <div key={reply.id} className="flex gap-2">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                {reply.profiles.avatar_url ? (
                  <img
                    src={reply.profiles.avatar_url}
                    alt={reply.profiles.display_name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {reply.profiles.display_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {reply.profiles.display_name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {reply.text}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {hasMoreReplies && (
        <div className="ml-4 pl-4">
          <button className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
            View {replies.length - maxReplies} more replies
          </button>
        </div>
      )}
    </div>
  );
};





















