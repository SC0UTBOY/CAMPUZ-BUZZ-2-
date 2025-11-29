
import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  Calendar,
  Trash2
} from 'lucide-react';
import { PostImage } from '@/components/common/PostImage';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { EnhancedPostData } from '@/types/posts';
import { HashtagText } from '@/components/common/HashtagText';
import { PostsService } from '@/services/postsService';
import { PostInteractionService } from '@/services/postInteractionService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EnhancedPostCardProps {
  post: EnhancedPostData;
  onReact?: (postId: string, reactionType: string) => void;
  onSave?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  className?: string;
}

export const EnhancedPostCard = memo<EnhancedPostCardProps>(({
  post,
  onReact,
  onSave,
  onComment,
  onDelete,
  className
}) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [hasLoadedComments, setHasLoadedComments] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleLike = () => onReact?.(post.id, 'like');
  const handleSave = () => onSave?.(post.id);

  // Fetch comments only ONCE when comments section is opened
  const fetchComments = React.useCallback(async () => {
    if (hasLoadedComments) return;

    setIsLoadingComments(true);
    try {
      const fetchedComments = await PostsService.getComments(post.id);
      setComments(fetchedComments);
      setHasLoadedComments(true);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingComments(false);
    }
  }, [hasLoadedComments, post.id, toast]);

  // Only fetch when showComments becomes true for the first time
  React.useEffect(() => {
    if (showComments && !hasLoadedComments) {
      fetchComments();
    }
  }, [showComments, hasLoadedComments, fetchComments]);

  const handleToggleComments = () => {
    setShowComments(!showComments);
    onComment?.(post.id);
  };

  const handleAddComment = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newComment.trim() || isCommenting) return;

    setIsCommenting(true);
    try {
      await PostsService.addComment(post.id, newComment.trim());
      setNewComment('');

      // Refresh comments ONCE after adding
      const updatedComments = await PostsService.getComments(post.id);
      setComments(updatedComments);

      toast({
        description: "Comment added successfully!"
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await PostsService.deleteComment(commentId);

      // Remove comment from local state
      setComments(prev => prev.filter(c => c.id !== commentId));

      toast({
        description: "Comment deleted successfully!"
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment.",
        variant: "destructive"
      });
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

    try {
      await PostInteractionService.deletePost(post.id);
      onDelete?.(post.id);

      toast({
        description: "Post deleted successfully!"
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post.",
        variant: "destructive"
      });
    }
  };

  // Debug logging for image URL
  React.useEffect(() => {
    if (post.image_url) {
      console.log('Post image URL:', post.image_url);
    }
  }, [post.image_url]);

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader className="pb-3">
        {/* Author Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={post.author?.avatar_url}
                alt={post.author?.display_name || 'User'}
              />
              <AvatarFallback>
                {(post.author?.display_name || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-foreground truncate">
                  {post.author?.display_name || 'Anonymous User'}
                </h3>
                {post.author?.major && (
                  <Badge variant="secondary" className="text-xs">
                    {post.author.major}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <time dateTime={post.created_at}>
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </time>
                {post.visibility !== 'public' && (
                  <Badge variant="outline" className="text-xs">
                    {post.visibility}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Delete Post Menu - Only show for post owner */}
          {user && post.user_id === user.id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDeletePost}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Post Title */}
        {post.title && (
          <h2 className="text-lg font-semibold text-foreground mt-2">
            {post.title}
          </h2>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Hashtags - Instagram style (above image) */}
        {post.image_url && post.content && (
          <HashtagText
            text={post.content}
            className="text-foreground whitespace-pre-wrap break-words"
            onlyHashtags={true}
          />
        )}

        {/* Media Content - Enhanced with PostImage component */}
        {post.image_url && (
          <>
            <div className="rounded-lg overflow-hidden bg-muted">
              <PostImage
                src={post.image_url}
                alt={post.title || post.content || 'Post media'}
                className="w-full max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                fallbackClassName="w-full h-48 bg-muted/50 flex items-center justify-center text-muted-foreground border border-border rounded-lg"
              />
            </div>

            {/* Instagram-style caption with username */}
            {post.content && (
              <div className="mt-3 text-sm">
                <span className="font-semibold text-foreground mr-2">@{post.author?.display_name || 'user'}</span>
                <span className="text-foreground">{post.content.replace(/#\w+/g, '').trim()}</span>
              </div>
            )}
          </>
        )}

        {/* For non-photo posts, show content normally */}
        {!post.image_url && post.content && (
          <HashtagText
            text={post.content}
            className="text-foreground whitespace-pre-wrap break-words"
          />
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                "text-muted-foreground hover:text-red-500",
                post.is_liked && "text-red-500"
              )}
            >
              <Heart className={cn("h-4 w-4 mr-1", post.is_liked && "fill-current")} />
              <span className="text-sm">{post.likes_count || 0}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleComments}
              className={cn(
                "text-muted-foreground hover:text-blue-500",
                showComments && "text-blue-500"
              )}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">{hasLoadedComments ? comments.length : (post.comments_count || 0)}</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className={cn(
              "text-muted-foreground hover:text-yellow-500",
              post.is_saved && "text-yellow-500"
            )}
          >
            <Bookmark className={cn("h-4 w-4", post.is_saved && "fill-current")} />
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="space-y-4 pt-4 border-t">
            {/* Add Comment Form */}
            {user && (
              <form onSubmit={handleAddComment} className="space-y-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  className="min-h-[80px] bg-muted/50 border-border"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={!newComment.trim() || isCommenting}
                    size="sm"
                  >
                    {isCommenting ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </form>
            )}

            {/* Comments List */}
            {isLoadingComments ? (
              <div className="text-center py-4 text-muted-foreground">Loading comments...</div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3 p-3 bg-muted/50 rounded-lg group">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.author.avatar} alt={comment.author.display_name || comment.author.username || 'User'} />
                      <AvatarFallback>
                        {(comment.author.display_name || comment.author.username || 'User').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{comment.author.display_name || comment.author.username || 'User'}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>

                        {/* Delete button - only show for comment owner */}
                        {user && comment.author_id === user.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                            title="Delete comment"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))}

                {comments.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No comments yet. Be the first to comment!
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

EnhancedPostCard.displayName = 'EnhancedPostCard';
