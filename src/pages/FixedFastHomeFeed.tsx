import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { FastLoader, FastSkeletonPost } from '@/components/common/FastLoader';
import { useFastPosts } from '@/hooks/useFastPosts';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Share2, Trash2, MoreHorizontal } from 'lucide-react';
import RobustHashtagMentionText from '@/components/common/RobustHashtagMentionText';
import { useWorkingLikes } from '@/hooks/useWorkingLikes';
import { useFixedComments } from '@/hooks/useFixedComments';
import { cn } from '@/lib/utils';

// Fixed Like Button Component
const FixedLikeButton = memo(({ 
  postId, 
  initialLiked, 
  initialCount, 
  onLike 
}: { 
  postId: string; 
  initialLiked: boolean; 
  initialCount: number; 
  onLike: (postId: string) => void;
}) => {
  const { getLikeState, isLiking } = useWorkingLikes();
  const likeState = getLikeState(postId, initialLiked, initialCount);
  
  const handleClick = () => {
    onLike(postId);
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className={cn(
        "h-8 px-2 transition-colors",
        likeState.isLiked && "text-red-500 hover:text-red-600",
        !likeState.isLiked && "text-muted-foreground hover:text-red-500"
      )}
      onClick={handleClick}
      disabled={likeState.isLoading || isLiking(postId)}
    >
      <Heart className={cn(
        "h-4 w-4 mr-1 transition-all",
        likeState.isLiked && "fill-current",
        likeState.isLoading && "animate-pulse"
      )} />
      <span className="text-xs">{likeState.count}</span>
      {likeState.isLoading && (
        <div className="ml-1 w-2 h-2 bg-current rounded-full animate-pulse" />
      )}
    </Button>
  );
});

// Fixed Comments Section Component
const FixedCommentsSection = memo(({ postId }: { postId: string }) => {
  const {
    comments,
    isLoading,
    isCreating,
    isDeleting,
    error,
    createComment,
    deleteComment,
    hasMoreComments,
    showAllComments,
    toggleShowAllComments
  } = useFixedComments(postId);

  const [commentText, setCommentText] = useState('');
  const { user } = useAuth();

  const handleSubmit = () => {
    if (!commentText.trim()) return;
    createComment(commentText);
    setCommentText('');
  };

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteComment(commentId);
    }
  };

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p className="text-sm">Unable to load comments</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Comment Form */}
      {user && (
        <div className="flex space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>{user.email?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[60px] resize-none text-sm"
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {commentText.length}/500
              </span>
              <Button 
                size="sm"
                onClick={handleSubmit}
                disabled={!commentText.trim() || isCreating}
              >
                {isCreating ? <FastLoader size="sm" /> : 'Comment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex space-x-2 animate-pulse">
              <div className="h-6 w-6 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-muted rounded w-1/4"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-2">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-2 group">
              <Avatar className="h-6 w-6">
                <AvatarImage src={comment.profiles.avatar_url} />
                <AvatarFallback>{comment.profiles.display_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-muted rounded-lg p-2 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-xs">{comment.profiles.display_name}</p>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                    {user && comment.user_id === user.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-600 focus:text-red-600"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <FastLoader size="sm" />
                            ) : (
                              <Trash2 className="h-3 w-3 mr-2" />
                            )}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(comment.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          
          {hasMoreComments && !showAllComments && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleShowAllComments}
              className="text-blue-600 hover:text-blue-700"
            >
              View more comments
            </Button>
          )}
        </div>
      ) : (
        <p className="text-center text-muted-foreground text-sm py-4">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
});

// Fixed Post Card Component
const FixedPostCard = memo(({ post }: { post: any }) => {
  const { toggleLike } = useWorkingLikes();
  const [showComments, setShowComments] = useState(false);
  
  const handleLike = (postId: string) => {
    toggleLike(postId);
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={post.author.avatar_url} />
          <AvatarFallback>{post.author.display_name?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm">{post.author.display_name}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="text-sm leading-relaxed">
          <RobustHashtagMentionText text={post.content} />
        </div>
        
        {post.image_url && (
          <img 
            src={post.image_url} 
            alt="Post content" 
            className="w-full rounded-lg max-h-96 object-cover"
            loading="lazy"
          />
        )}
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-4">
            <FixedLikeButton
              postId={post.id}
              initialLiked={post.is_liked || false}
              initialCount={post.likes_count || 0}
              onLike={handleLike}
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              <span className="text-xs">{post.comments_count || 0}</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-border">
            <FixedCommentsSection postId={post.id} />
          </div>
        )}
      </div>
    </Card>
  );
});

// Fast Post Creator (unchanged)
const FastPostCreator = memo(({ onSubmit, isLoading }: { onSubmit: any; isLoading: boolean }) => {
  const [content, setContent] = useState('');
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    try {
      await onSubmit({ content: content.trim() });
      setContent('');
    } catch (error) {
      // Error handled in hook
    }
  };

  if (!user) return null;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.user_metadata?.avatar_url} />
          <AvatarFallback>{user.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-[80px] resize-none border-0 bg-muted/50 p-3"
            maxLength={500}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {content.length}/500
            </span>
            <Button 
              onClick={handleSubmit}
              disabled={!content.trim() || isLoading}
              size="sm"
              className="px-6"
            >
              {isLoading ? <FastLoader size="sm" /> : 'Post'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
});

export default function FixedFastHomeFeed() {
  const { posts, loading, error, createPost, isCreating, retry } = useFastPosts();

  if (error && !posts.length) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Unable to load feed</h3>
          <p className="text-muted-foreground mb-4">Please check your connection and try again.</p>
          <Button onClick={retry}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Post Creator */}
      <FastPostCreator onSubmit={createPost} isLoading={isCreating} />

      {/* Posts Feed */}
      <div className="space-y-4">
        {loading && posts.length === 0 ? (
          // Initial loading
          <>
            <FastSkeletonPost />
            <FastSkeletonPost />
            <FastSkeletonPost />
          </>
        ) : posts.length === 0 ? (
          // Empty state
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-4">Be the first to share something!</p>
          </Card>
        ) : (
          // Posts list
          posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <FixedPostCard post={post} />
            </motion.div>
          ))
        )}

        {/* Loading indicator for additional posts */}
        {loading && posts.length > 0 && (
          <div className="py-4">
            <FastLoader />
          </div>
        )}
      </div>
    </div>
  );
}
