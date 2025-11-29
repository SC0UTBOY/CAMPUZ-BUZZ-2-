
import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { FastLoader, FastSkeletonPost } from '@/components/common/FastLoader';
import { useFastPosts } from '@/hooks/useFastPosts';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, MoreVertical, Trash2 } from 'lucide-react';
import { HashtagText } from '@/components/common/HashtagText';
import { PostsService } from '@/services/postsService';
import { PostInteractionService } from '@/services/postInteractionService';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Fast Post Card Component
const FastPostCard = memo(({ post, onLike, onDelete }: { post: any; onLike: (postId: string) => void; onDelete: (postId: string) => void }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [hasLoadedComments, setHasLoadedComments] = useState(false);
  const { toast} = useToast();
  const { user } = useAuth();

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
      onDelete(post.id);
      
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

  return (
  <Card className="p-4 space-y-3">
    <div className="flex items-center justify-between">
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
      
      {/* Delete Post Menu - Only show for post owner */}
      {user && post.user_id === user.id && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
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
    
    <div className="space-y-3">
      <HashtagText 
        text={post.content} 
        className="text-sm leading-relaxed"
      />
      
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
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 px-2 ${post.is_liked ? 'text-red-500' : ''}`}
            onClick={() => onLike(post.id)}
          >
            <Heart className={`h-4 w-4 mr-1 ${post.is_liked ? 'fill-current' : ''}`} />
            <span className="text-xs">{post.likes_count || 0}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2"
            onClick={handleToggleComments}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            <span className="text-xs">{hasLoadedComments ? comments.length : (post.comments_count || 0)}</span>
          </Button>
        </div>
      </div>
    </div>

    {/* Comments Section */}
    {showComments && (
      <div className="space-y-3 pt-3 border-t">
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
              className="min-h-[60px] text-sm bg-muted/50 border-border"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!newComment.trim() || isCommenting}
                size="sm"
              >
                {isCommenting ? "Posting..." : "Post"}
              </Button>
            </div>
          </form>
        )}

        {/* Comments List */}
        {isLoadingComments ? (
          <div className="text-center py-2 text-xs text-muted-foreground">Loading comments...</div>
        ) : (
          <div className="space-y-2">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-2 p-2 bg-muted/50 rounded text-sm group">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-xs">{comment.author?.display_name || 'Anonymous'}</span>
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
                  <p className="text-xs text-foreground">{comment.content}</p>
                </div>
              </div>
            ))}
            
            {comments.length === 0 && (
              <div className="text-center py-2 text-xs text-muted-foreground">
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>
        )}
      </div>
    )}
  </Card>
  );
});

// Fast Post Creator
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

export default function FastHomeFeed() {
  const { posts, loading, error, createPost, isCreating, toggleLike, retry } = useFastPosts();
  const [localPosts, setLocalPosts] = React.useState(posts);

  React.useEffect(() => {
    setLocalPosts(posts);
  }, [posts]);

  const handleDeletePost = (postId: string) => {
    setLocalPosts(prev => prev.filter(p => p.id !== postId));
  };

  if (error && !localPosts.length) {
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
        {loading && localPosts.length === 0 ? (
          // Initial loading
          <>
            <FastSkeletonPost />
            <FastSkeletonPost />
            <FastSkeletonPost />
          </>
        ) : localPosts.length === 0 ? (
          // Empty state
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-4">Be the first to share something!</p>
          </Card>
        ) : (
          // Posts list
          localPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <FastPostCard post={post} onLike={toggleLike} onDelete={handleDeletePost} />
            </motion.div>
          ))
        )}

        {/* Loading indicator for additional posts */}
        {loading && localPosts.length > 0 && (
          <div className="py-4">
            <FastLoader />
          </div>
        )}
      </div>
    </div>
  );
}
