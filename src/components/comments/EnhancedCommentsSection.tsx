import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useComments } from '@/hooks/useComments';
import { EnhancedCommentForm } from './EnhancedCommentForm';
import { CommentItem } from './CommentItem';
import { cn } from '@/lib/utils';

interface EnhancedCommentsSectionProps {
  postId: string;
  initialCommentsCount?: number;
  className?: string;
  compact?: boolean;
}

/**
 * Enhanced comments section with better UX and real-time updates
 */
export const EnhancedCommentsSection: React.FC<EnhancedCommentsSectionProps> = ({
  postId,
  initialCommentsCount = 0,
  className,
  compact = false
}) => {
  const {
    comments,
    recentComments,
    isLoading,
    isCreating,
    error,
    createComment,
    deleteComment,
    updateComment,
    toggleShowAllComments,
    showAllComments,
    hasMoreComments
  } = useComments(postId);

  const [isExpanded, setIsExpanded] = useState(!compact);

  const handleCreateComment = (content: string) => {
    createComment(content);
  };

  const handleReply = (parentId: string, content: string) => {
    createComment(content, parentId);
  };

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      toggleShowAllComments();
    }
  };

  if (error) {
    return (
      <Card className={cn("border-red-200 dark:border-red-800", className)}>
        <CardContent className="p-4">
          <div className="text-center text-red-600 dark:text-red-400">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Unable to load comments. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayComments = showAllComments ? comments : recentComments;
  const commentCount = displayComments.length;

  return (
    <Card className={cn("border-t-0 rounded-t-none", className)}>
      <CardContent className="p-0">
        {/* Comments Header */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">
                {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
              </span>
              {initialCommentsCount > commentCount && (
                <span className="text-xs text-muted-foreground">
                  ({initialCommentsCount} total)
                </span>
              )}
            </div>
            
            {hasMoreComments && !showAllComments && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleShowAllComments}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
              >
                <span className="text-sm">View all comments</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            )}
            
            {showAllComments && hasMoreComments && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleShowAllComments}
                className="flex items-center space-x-1 text-muted-foreground hover:text-foreground"
              >
                <span className="text-sm">Show recent only</span>
                <ChevronUp className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Comment Form */}
        <div className="px-4 py-3 border-b border-border">
          <EnhancedCommentForm
            onSubmit={handleCreateComment}
            isSubmitting={isCreating}
            placeholder="Write a comment..."
            autoFocus={false}
          />
        </div>

        {/* Comments List */}
        <div className="px-4 py-3">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex space-x-3 animate-pulse">
                  <div className="h-8 w-8 bg-muted rounded-full flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : commentCount > 0 ? (
            <div className="space-y-2">
              {displayComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={handleReply}
                  onDelete={deleteComment}
                  onUpdate={updateComment}
                  depth={0}
                  maxDepth={3}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium mb-1">No comments yet</p>
              <p className="text-sm">Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedCommentsSection;









