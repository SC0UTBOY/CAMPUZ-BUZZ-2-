
import React, { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Calendar
} from 'lucide-react';
import { PostImage } from '@/components/common/PostImage';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { EnhancedPostData } from '@/types/posts';
import RobustHashtagMentionText from '@/components/common/RobustHashtagMentionText';

interface EnhancedPostCardProps {
  post: EnhancedPostData;
  onReact?: (postId: string, reactionType: string) => void;
  onSave?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onComment?: (postId: string) => void;
  className?: string;
}

export const EnhancedPostCard = memo<EnhancedPostCardProps>(({
  post,
  onReact,
  onSave,
  onShare,
  onComment,
  className
}) => {
  const handleLike = () => onReact?.(post.id, 'like');
  const handleSave = () => onSave?.(post.id);
  const handleShare = () => onShare?.(post.id);
  const handleComment = () => onComment?.(post.id);

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
          
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Post Title */}
        {post.title && (
          <h2 className="text-lg font-semibold text-foreground mt-2">
            {post.title}
          </h2>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Post Content */}
        {post.content && (
          <div className="text-foreground whitespace-pre-wrap break-words">
            <RobustHashtagMentionText text={post.content} />
          </div>
        )}

        {/* Media Content - Enhanced with PostImage component */}
        {post.image_url && (
          <div className="rounded-lg overflow-hidden bg-muted">
            <PostImage
              src={post.image_url}
              alt={post.title || post.content || 'Post media'}
              className="w-full max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
              fallbackClassName="w-full h-48 bg-muted/50 flex items-center justify-center text-muted-foreground border border-border rounded-lg"
            />
          </div>
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
              onClick={handleComment}
              className="text-muted-foreground hover:text-blue-500"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">{post.comments_count || 0}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-muted-foreground hover:text-green-500"
            >
              <Share2 className="h-4 w-4 mr-1" />
              <span className="text-sm">{post.shares_count || 0}</span>
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
      </CardContent>
    </Card>
  );
});

EnhancedPostCard.displayName = 'EnhancedPostCard';
