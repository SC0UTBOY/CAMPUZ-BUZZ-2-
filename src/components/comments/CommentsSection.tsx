
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useComments } from '@/hooks/useComments';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';

interface CommentsSectionProps {
  postId: string;
  initialCommentsCount?: number;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  postId,
  initialCommentsCount = 0
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

  const handleCreateComment = (content: string) => {
    createComment(content);
  };

  const handleReply = (parentId: string, content: string) => {
    createComment(content, parentId);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Unable to load comments. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Comments Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4" />
            <span className="font-medium">
              {showAllComments ? comments.length : recentComments.length} of {initialCommentsCount} comments
            </span>
          </div>
          
          {hasMoreComments && !showAllComments && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleShowAllComments}
              className="flex items-center space-x-1"
            >
              <span>View all comments</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          )}
          
          {showAllComments && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleShowAllComments}
              className="flex items-center space-x-1"
            >
              <span>Show recent only</span>
              <ChevronUp className="h-3 w-3" />
            </Button>
          )}
        </div>

        <Separator />

        {/* Comment Form */}
        <CommentForm
          onSubmit={handleCreateComment}
          isSubmitting={isCreating}
        />

        {/* Comments List */}
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
        ) : comments.length > 0 ? (
          <div className="space-y-2">
            {comments.map((comment) => (
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
      </CardContent>
    </Card>
  );
};
