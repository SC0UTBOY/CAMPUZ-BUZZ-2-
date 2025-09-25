import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SimpleCommentsService, simpleCommentsService, Comment, CreateCommentData } from '@/services/simpleCommentsService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useFixedComments = (postId: string) => {
  const [showAllComments, setShowAllComments] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query for recent comments (for feed)
  const {
    data: recentComments = [],
    isLoading: loadingRecent,
    error: recentError
  } = useQuery({
    queryKey: ['comments', 'recent', postId],
    queryFn: () => simpleCommentsService.getRecentComments(postId, 3),
    enabled: !!postId,
    staleTime: 30000 // 30 seconds
  });

  // Query for all comments (when expanded)
  const {
    data: allComments = [],
    isLoading: loadingAll,
    error: allError
  } = useQuery({
    queryKey: ['comments', 'all', postId],
    queryFn: () => simpleCommentsService.getPostComments(postId, 100),
    enabled: showAllComments && !!postId,
    staleTime: 30000
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (commentData: CreateCommentData) => {
      if (!user) {
        throw new Error('Please log in to comment');
      }
      return simpleCommentsService.createComment(commentData);
    },
    onSuccess: (newComment) => {
      // Invalidate and refetch comments
      queryClient.invalidateQueries({ queryKey: ['comments', 'recent', postId] });
      queryClient.invalidateQueries({ queryKey: ['comments', 'all', postId] });
      
      // Update post data
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['fast-posts'] });
      
      toast({
        title: "Comment posted!",
        description: "Your comment has been added successfully."
      });
    },
    onError: (error: any) => {
      console.error('Error creating comment:', error);
      toast({
        title: "Error posting comment",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => simpleCommentsService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'recent', postId] });
      queryClient.invalidateQueries({ queryKey: ['comments', 'all', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['fast-posts'] });
      
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed."
      });
    },
    onError: (error: any) => {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error deleting comment",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    }
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) => 
      simpleCommentsService.updateComment(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', 'recent', postId] });
      queryClient.invalidateQueries({ queryKey: ['comments', 'all', postId] });
      
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully."
      });
    },
    onError: (error: any) => {
      console.error('Error updating comment:', error);
      toast({
        title: "Error updating comment",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    }
  });

  const createComment = useCallback((content: string, parentId?: string) => {
    if (!content.trim()) {
      toast({
        title: "Empty comment",
        description: "Please write something before posting.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to post comments.",
        variant: "destructive"
      });
      return;
    }
    
    createCommentMutation.mutate({
      post_id: postId,
      content: content.trim(),
      parent_id: parentId
    });
  }, [postId, user, createCommentMutation, toast]);

  const deleteComment = useCallback((commentId: string) => {
    deleteCommentMutation.mutate(commentId);
  }, [deleteCommentMutation]);

  const updateComment = useCallback((commentId: string, content: string) => {
    if (!content.trim()) {
      toast({
        title: "Empty comment",
        description: "Comment cannot be empty.",
        variant: "destructive"
      });
      return;
    }
    updateCommentMutation.mutate({ commentId, content: content.trim() });
  }, [updateCommentMutation, toast]);

  const toggleShowAllComments = useCallback(() => {
    setShowAllComments(prev => !prev);
  }, []);

  return {
    // Data
    comments: showAllComments ? allComments : recentComments,
    recentComments,
    allComments,
    
    // Loading states
    isLoading: showAllComments ? loadingAll : loadingRecent,
    isCreating: createCommentMutation.isPending,
    isDeleting: deleteCommentMutation.isPending,
    isUpdating: updateCommentMutation.isPending,
    
    // Error states
    error: showAllComments ? allError : recentError,
    
    // Actions
    createComment,
    deleteComment,
    updateComment,
    toggleShowAllComments,
    
    // State
    showAllComments,
    hasMoreComments: recentComments.length >= 3
  };
};

export default useFixedComments;
