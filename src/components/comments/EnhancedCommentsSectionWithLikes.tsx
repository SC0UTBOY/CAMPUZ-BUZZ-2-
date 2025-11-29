import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CommentsService, Comment, CommentReplyWithProfile } from '@/services/commentsService';
import { EnhancedCommentItem } from './EnhancedCommentItem';
import { CommentForm } from './CommentForm';
import { Loader2, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedCommentsSectionWithLikesProps {
  postId: string;
  showCommentForm?: boolean;
  maxComments?: number;
  maxReplies?: number;
}

export const EnhancedCommentsSectionWithLikes: React.FC<EnhancedCommentsSectionWithLikesProps> = ({
  postId,
  showCommentForm = true,
  maxComments = 20,
  maxReplies = 3
}) => {
  const [showAllComments, setShowAllComments] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch comments with likes and replies
  const {
    data: comments = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['comments-with-likes', postId],
    queryFn: () => CommentsService.getCommentsWithLikesAndReplies(postId, maxComments),
    enabled: !!postId
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: CommentsService.createComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments-with-likes', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: any) => {
      console.error('Error creating comment:', error);
      toast({
        title: "Error posting comment",
        description: error.message || "Failed to post comment. Please try again later.",
        variant: "destructive"
      });
    }
  });

  // Handle comment creation
  const handleCreateComment = async (content: string) => {
    try {
      await createCommentMutation.mutateAsync({
        post_id: postId,
        content
      });
      toast({
        title: "Comment posted!",
        description: "Your comment has been added successfully."
      });
    } catch (error) {
      // Error is already handled in the mutation's onError callback
      // Don't throw the error here to prevent the UI from crashing
      console.error('Error in handleCreateComment:', error);
    }
  };

  // Handle like change
  const handleLikeChange = (commentId: string, liked: boolean, likeCount: number) => {
    // Optimistically update the UI
    queryClient.setQueryData(['comments-with-likes', postId], (oldData: Comment[] | undefined) => {
      if (!oldData) return oldData;
      return oldData.map(comment => 
        comment.id === commentId 
          ? { ...comment, isLiked: liked, likes_count: likeCount }
          : comment
      );
    });
  };

  // Handle reply added
  const handleReplyAdded = (commentId: string, reply: CommentReplyWithProfile) => {
    // Optimistically update the UI
    queryClient.setQueryData(['comments-with-likes', postId], (oldData: Comment[] | undefined) => {
      if (!oldData) return oldData;
      return oldData.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              commentReplies: [...(comment.commentReplies || []), reply],
              reply_count: (comment.reply_count || 0) + 1
            }
          : comment
      );
    });
  };

  const displayComments = showAllComments ? comments : comments.slice(0, 3);
  const hasMoreComments = comments.length > 3;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading comments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Error loading comments</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      {showCommentForm && (
        <CommentForm
          onSubmit={handleCreateComment}
          isLoading={createCommentMutation.isPending}
          placeholder="Write a comment..."
          submitText="Comment"
        />
      )}

      {/* Comments Count */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <MessageCircle className="h-4 w-4" />
        <span>{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No comments yet</p>
          <p className="text-sm">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-0">
          {displayComments.map((comment) => (
            <EnhancedCommentItem
              key={comment.id}
              comment={comment}
              onLikeChange={handleLikeChange}
              onReplyAdded={handleReplyAdded}
              showReplies={true}
              maxReplies={maxReplies}
            />
          ))}
        </div>
      )}

      {/* Show More Comments Button */}
      {hasMoreComments && !showAllComments && (
        <div className="text-center">
          <button
            onClick={() => setShowAllComments(true)}
            className="px-4 py-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            View all {comments.length} comments
          </button>
        </div>
      )}

      {/* Show Less Comments Button */}
      {hasMoreComments && showAllComments && (
        <div className="text-center">
          <button
            onClick={() => setShowAllComments(false)}
            className="px-4 py-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            Show less
          </button>
        </div>
      )}
    </div>
  );
};





















