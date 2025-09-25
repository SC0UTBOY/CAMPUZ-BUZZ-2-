
import React, { useState } from 'react';
import { useFixedPosts } from '@/hooks/useFixedPosts';
import { PostCard } from '@/components/posts/PostCard';
import { CreatePostModal } from '@/components/posts/CreatePostModal';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const FixedHomeFeed = () => {
  const { posts, loading, handleCreatePost, handleLikePost } = useFixedPosts();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <Card className="p-6">
          <Skeleton className="h-20 w-full" />
        </Card>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  const handlePostSubmit = async (postData: any) => {
    await handleCreatePost(postData);
    setShowCreateModal(false);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card className="p-6">
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create a Post
        </Button>
      </Card>

      <CreatePostModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handlePostSubmit}
      />
      
      <div className="space-y-6">
        {posts.length === 0 ? (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground">Be the first to share something!</p>
          </Card>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={{
                id: post.id,
                author: {
                  name: post.profiles?.display_name || 'Anonymous User',
                  avatar: post.profiles?.avatar_url,
                  major: post.profiles?.major || '',
                  year: post.profiles?.year || ''
                },
                content: post.content,
                image: post.image_url,
                timestamp: post.created_at,
                likes: post.likes_count,
                comments: post.comments_count,
                tags: post.tags || [],
                isLiked: false
              }}
              onLike={() => handleLikePost(post.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
