
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PostImage } from '@/components/common/PostImage';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { usePostReactions } from '@/hooks/usePostReactions';
import { usePostSaves } from '@/hooks/usePostSaves';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { EnhancedPostData } from '@/types/posts';
import { HashtagText } from '@/components/common/HashtagText';

interface PostWithCommentsProps {
  post: EnhancedPostData;
  onReact?: (postId: string, reactionType: string) => void;
  onSave?: (postId: string) => void;
  showComments?: boolean;
  className?: string;
}

export const PostWithComments: React.FC<PostWithCommentsProps> = ({
  post,
  onReact,
  onSave,
  showComments: initialShowComments = false,
  className
}) => {
  const [showComments, setShowComments] = useState(initialShowComments);
  const { reactToPost, isLoading: isReactionLoading } = usePostReactions();
  const { toggleSave, isLoading: isSaveLoading } = usePostSaves();

  const handleLike = () => {
    reactToPost(post.id, 'like');
    onReact?.(post.id, 'like');
  };
  
  const handleSave = () => {
    toggleSave(post.id);
    onSave?.(post.id);
  };
  
  const handleComment = () => setShowComments(!showComments);

  return (
    <div className={cn("w-full max-w-2xl mx-auto space-y-4", className)}>
      {/* Main Post Card */}
      <Card>
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

          {/* Media Content */}
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

          {/* Engagement Stats */}
          {(post.likes_count > 0 || post.comments_count > 0) && (
            <div className="flex items-center justify-between py-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-4">
                {post.likes_count > 0 && (
                  <span>{post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}</span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {post.comments_count > 0 && (
                  <span>{post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}</span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isReactionLoading(post.id)}
                className={cn(
                  "text-muted-foreground hover:text-red-500",
                  post.is_liked && "text-red-500"
                )}
              >
                <Heart className={cn("h-4 w-4 mr-1", post.is_liked && "fill-current")} />
                <span className="text-sm">{isReactionLoading(post.id) ? 'Liking...' : 'Like'}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleComment}
                className={cn(
                  "text-muted-foreground hover:text-blue-500",
                  showComments && "text-blue-500"
                )}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Comment</span>
                {showComments ? (
                  <ChevronUp className="h-3 w-3 ml-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 ml-1" />
                )}
              </Button>

            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={isSaveLoading(post.id)}
              className={cn(
                "text-muted-foreground hover:text-yellow-500",
                post.is_saved && "text-yellow-500"
              )}
            >
              <Bookmark className={cn("h-4 w-4", post.is_saved && "fill-current")} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      {showComments && (
        <CommentsSection
          postId={post.id}
          initialCommentsCount={post.comments_count}
        />
      )}
    </div>
  );
};
