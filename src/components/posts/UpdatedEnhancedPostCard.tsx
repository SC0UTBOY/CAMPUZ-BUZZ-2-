

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { PostReactionButton } from '@/components/posts/PostReactionButton';
import { PostActions } from '@/components/posts/PostActions';
import { PostImage } from '@/components/common/PostImage';
import { MessageSquare, Bookmark, BookmarkCheck, MapPin, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { EnhancedPostData } from '@/services/enhancedPostsService';
import { useAuth } from '@/contexts/AuthContext';
import { HashtagText } from '@/components/common/HashtagText';
import { PostsService } from '@/services/postsService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface UpdatedEnhancedPostCardProps {
  post: EnhancedPostData;
  onLike?: () => void;
  onReact: (postId: string, reactionType: string) => void;
  onSave?: () => void;
  onComment?: () => void;
  className?: string;
}

export const UpdatedEnhancedPostCard: React.FC<UpdatedEnhancedPostCardProps> = ({
  post,
  onLike,
  onReact,
  onSave,
  onComment,
  className = ''
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const isOwnPost = user?.id === post.user_id;

  const handleReaction = (reactionType: string) => {
    onReact(post.id, reactionType);
  };

  // Debug logging for image URL
  React.useEffect(() => {
    if (post.image_url) {
      console.log('Updated post image URL:', post.image_url);
    }
  }, [post.image_url]);

  // Real-time subscription for comments
  React.useEffect(() => {
    if (!post.id || !showComments) return;

    const channel = supabase
      .channel(`post-comments-${post.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${post.id}`,
        },
        async (payload) => {
          console.log('Comment realtime event:', payload);

          if (payload.eventType === 'INSERT') {
            // Fetch the new comment with user profile
            const { data: newComment } = await (supabase
              .from('comments') as any)
              .select(`
                id,
                content,
                created_at,
                user_id,
                user_profiles (full_name, avatar_url)
              `)
              .eq('id', payload.new.id)
              .single();

            if (newComment) {
              setComments((prev) => [
                ...prev,
                {
                  id: newComment.id,
                  post_id: post.id,
                  author_id: newComment.user_id,
                  content: newComment.content,
                  created_at: newComment.created_at,
                  updated_at: newComment.created_at,
                  author: {
                    id: newComment.user_id,
                    username: newComment.user_profiles?.full_name || 'unknown',
                    display_name: newComment.user_profiles?.full_name || 'Unknown User',
                    avatar: newComment.user_profiles?.avatar_url || ''
                  }
                }
              ]);
            }
          }

          if (payload.eventType === 'UPDATE') {
            setComments((prev) =>
              prev.map((c) =>
                c.id === payload.new.id
                  ? { ...c, content: payload.new.content }
                  : c
              )
            );
          }

          if (payload.eventType === 'DELETE') {
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id, showComments]);

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


  return (
    <Card className={`shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={post.author.avatar_url} />
              <AvatarFallback>{post.author.display_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-foreground hover:underline cursor-pointer">
                  {post.author.display_name}
                </h3>
                {post.author.major && (
                  <Badge variant="outline" className="text-xs">
                    {post.author.major}
                  </Badge>
                )}
                {post.author.year && (
                  <Badge variant="secondary" className="text-xs">
                    {post.author.year}
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
          <PostActions
            postId={post.id}
            isOwnPost={isOwnPost}
            onEdit={() => { }}
            onDelete={() => { }}
          />
        </div>

        {/* Title */}
        {post.title && (
          <h2 className="text-xl font-bold text-foreground mb-3">
            {post.title}
          </h2>
        )}

        {/* Hashtags - Instagram style (above image) */}
        {post.image_url && post.content && (
          <HashtagText
            text={post.content}
            className="text-foreground whitespace-pre-wrap break-words mb-3"
            onlyHashtags={true}
          />
        )}

        {/* Media - Enhanced with PostImage component */}
        {post.image_url && (
          <>
            <div className="rounded-lg overflow-hidden bg-muted mb-4">
              <PostImage
                src={post.image_url}
                alt={post.title || post.content || 'Post content'}
                className="w-full max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                fallbackClassName="w-full h-48 bg-muted/50 flex items-center justify-center text-muted-foreground border border-border rounded-lg"
              />
            </div>

            {/* Instagram-style caption with username */}
            <div className="mb-4 mt-3 text-sm">
              <span className="font-semibold text-foreground mr-2">@{post.author?.display_name || 'user'}</span>
              <span className="text-foreground leading-relaxed">{post.content.replace(/#\w+/g, '').trim()}</span>
            </div>
          </>
        )}

        {/* For non-photo posts, show content normally */}
        {!post.image_url && (
          <div className="mb-4">
            <HashtagText
              text={post.content}
              className="text-foreground leading-relaxed"
            />
          </div>
        )}

        {/* Tags and Hashtags */}
        <div className="space-y-2">
          {renderTags()}
          {renderHashtags()}
        </div>

        {/* Engagement Stats */}
        {(post.likes_count > 0 || post.comments_count > 0) && (
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
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2">
            <PostReactionButton
              reactions={post.reactions}
              userReaction={post.user_reaction}
              onReact={handleReaction}
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (!showComments && comments.length === 0) {
                  setIsLoadingComments(true);
                  try {
                    const fetchedComments = await PostsService.getComments(post.id);
                    setComments(fetchedComments);
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
                }
                setShowComments(!showComments);
                onComment?.();
              }}
              className={cn(
                "flex items-center space-x-2 text-muted-foreground hover:text-foreground",
                showComments && "text-blue-500"
              )}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Comment</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            className={`flex items-center space-x-2 ${post.is_saved
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
          <div className="space-y-4 pt-4 border-t border-border mt-4">
            {/* Add Comment Form */}
            {user && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newComment.trim() || isCommenting) return;

                  setIsCommenting(true);
                  try {
                    await PostsService.addComment(post.id, newComment.trim());
                    setNewComment('');

                    // Refresh comments
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
                }}
                className="space-y-2"
              >
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
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
                  <div key={comment.id} className="flex space-x-3 p-3 bg-muted/50 rounded-lg">
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
                        {user?.id === comment.author_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                await PostsService.deleteComment(comment.id);
                                // Comment will be removed via realtime subscription
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
                            }}
                            className="h-6 text-xs text-muted-foreground hover:text-destructive"
                          >
                            Delete
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
};
