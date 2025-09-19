
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
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import RobustHashtagMentionText from '@/components/common/RobustHashtagMentionText';
import { EnhancedLikeButton } from '@/components/posts/EnhancedLikeButton';
import { useEnhancedLikes } from '@/hooks/useEnhancedLikes';
import { EnhancedCommentsSection } from '@/components/comments/EnhancedCommentsSection';

// Fast Post Card Component
const FastPostCard = memo(({ post, onLike }: { post: any; onLike: (postId: string, isLiked: boolean) => Promise<void> }) => {
  const { getLikeState } = useEnhancedLikes();
  const likeState = getLikeState(post.id, post.is_liked, post.likes_count);
  const [showComments, setShowComments] = useState(false);
  
  return (
  <Card className="p-4 space-y-3">
    <div className="flex items-center space-x-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={post.profiles?.avatar_url || undefined} />
        <AvatarFallback>{post.profiles?.display_name?.[0] || 'U'}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-semibold text-sm">{post.profiles?.display_name || 'Unknown User'}</p>
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
          <EnhancedLikeButton
            postId={post.id}
            initialLiked={likeState.isLiked}
            initialCount={likeState.count}
            onLike={onLike}
            size="sm"
            showCount={true}
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
          <EnhancedCommentsSection
            postId={post.id}
            initialCommentsCount={post.comments_count || 0}
            compact={true}
          />
        </div>
      )}
    </div>
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
  const { posts, loading, error, createPost, isCreating, retry } = useFastPosts();
  const { toggleLike } = useEnhancedLikes();

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
              <FastPostCard post={post} onLike={toggleLike} />
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
