
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PostReactionButton } from '@/components/posts/PostReactionButton';
import { PostImage } from '@/components/common/PostImage';
import RobustHashtagMentionText from '@/components/common/RobustHashtagMentionText';
import { MessageSquare, Share2, Bookmark, BookmarkCheck, MapPin, Clock, Trash2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EnhancedLikeButton } from '@/components/posts/EnhancedLikeButton';
import { useEnhancedLikes } from '@/hooks/useEnhancedLikes';
import { EnhancedCommentsSection } from '@/components/comments/EnhancedCommentsSection';
import { formatDistanceToNow } from 'date-fns';
import { EnhancedPostData } from '@/services/enhancedPostsService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UpdatedEnhancedPostCardProps {
  post: EnhancedPostData;
  onReact: (postId: string, reactionType: string) => void;
  onSave?: () => void;
  onShare?: () => void;
  onComment?: () => void;
  onLike?: (postId: string, isLiked: boolean) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  className?: string;
}

export const UpdatedEnhancedPostCard: React.FC<UpdatedEnhancedPostCardProps> = ({
  post,
  onReact,
  onSave,
  onShare,
  onComment,
  onLike,
  onDelete,
  className = ''
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwnPost = user?.id === post.user_id;
  const { getLikeState } = useEnhancedLikes();
  const likeState = getLikeState(post.id, post.is_liked || false, post.likes_count || 0);

  const handleReaction = (reactionType: string) => {
    onReact(post.id, reactionType);
  };

  const handleDelete = async () => {
    if (!onDelete || !isOwnPost) return;
    
    setIsDeleting(true);
    try {
      await onDelete(post.id);
      toast({
        title: 'Post Deleted',
        description: 'Your post has been deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete post. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Debug logging for image URL
  React.useEffect(() => {
    if (post.image_url) {
      console.log('Updated post image URL:', post.image_url);
    }
  }, [post.image_url]);

  const renderHashtags = () => {
    if (!post.hashtags || post.hashtags.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {post.hashtags.map((hashtag) => (
          <Badge
            key={hashtag}
            variant="outline"
            className="text-xs cursor-pointer hover:bg-primary/10"
          >
            #{hashtag}
          </Badge>
        ))}
      </div>
    );
  };

  const renderTags = () => {
    if (!post.tags || post.tags.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {post.tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="text-xs"
          >
            {tag}
          </Badge>
        ))}
      </div>
    );
  };

  const renderPostContent = () => {
    return (
      <RobustHashtagMentionText 
        text={post.content} 
        className="text-foreground leading-relaxed"
      />
    );
  };

  return (
    <Card className={`shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={post.profiles?.avatar_url || undefined} />
              <AvatarFallback>
                {(post.profiles?.display_name?.charAt(0)) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-foreground hover:underline cursor-pointer">
                  {post.profiles?.display_name || 'Unknown User'}
                </h3>
                {post.profiles?.major && (
                  <Badge variant="outline" className="text-xs">
                    {post.profiles.major}
                  </Badge>
                )}
                {post.profiles?.year && (
                  <Badge variant="secondary" className="text-xs">
                    {post.profiles.year}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                {post.location && (
                  <>
                    <span>•</span>
                    <MapPin className="h-3 w-3" />
                    <span>{post.location}</span>
                  </>
                )}
                {post.visibility !== 'public' && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      {post.visibility}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          {/* Post Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwnPost && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Post
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Post</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this post? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                Share Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        {post.title && (
          <h2 className="text-xl font-bold text-foreground mb-3">
            {post.title}
          </h2>
        )}

        {/* Content */}
        <div className="mb-4">
          {renderPostContent()}
        </div>

        {/* Media - Enhanced with PostImage component */}
        {post.image_url && (
          <div className="rounded-lg overflow-hidden bg-muted mb-4">
            <PostImage
              src={post.image_url}
              alt={post.title || post.content || 'Post content'}
              className="w-full max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
              fallbackClassName="w-full h-48 bg-muted/50 flex items-center justify-center text-muted-foreground border border-border rounded-lg"
            />
          </div>
        )}

        {/* Tags and Hashtags */}
        <div className="space-y-2">
          {renderTags()}
          {renderHashtags()}
        </div>

        {/* Engagement Stats */}
        {(post.likes_count > 0 || post.comments_count > 0 || post.shares_count > 0) && (
          <div className="flex items-center justify-between py-3 border-t border-b border-border mt-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              {Object.keys(post.reactions).length > 0 && (
                <span>
                  {Object.values(post.reactions).reduce((sum, r) => sum + r.count, 0)} reactions
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {post.comments_count > 0 && (
                <span>{post.comments_count} comments</span>
              )}
              {post.shares_count > 0 && (
                <span>{post.shares_count} shares</span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2">
            {onLike ? (
              <EnhancedLikeButton
                postId={post.id}
                initialLiked={likeState.isLiked}
                initialCount={likeState.count}
                onLike={onLike}
                size="sm"
                showCount={true}
              />
            ) : (
              <PostReactionButton
                reactions={post.reactions}
                userReaction={post.user_reaction}
                onReact={handleReaction}
              />
            )}
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setShowComments(!showComments);
                onComment?.();
              }}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Comment</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onShare}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={onSave}
            className={`flex items-center space-x-2 ${
              post.is_saved 
                ? 'text-primary hover:text-primary/80' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {post.is_saved ? (
              <BookmarkCheck className="h-4 w-4 fill-current" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4">
            <EnhancedCommentsSection
              postId={post.id}
              initialCommentsCount={post.comments_count || 0}
              compact={false}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
