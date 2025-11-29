import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleLikeButton } from '@/components/posts/SimpleLikeButton';

/**
 * Simple test component to check basic like functionality
 */
export const SimpleLikeTest: React.FC = () => {
  const [testPosts] = useState([
    {
      id: 'test-1',
      content: 'Simple test post 1',
      author: 'Test User 1',
      initialLiked: false,
      initialCount: 5
    },
    {
      id: 'test-2', 
      content: 'Simple test post 2',
      author: 'Test User 2',
      initialLiked: true,
      initialCount: 12
    }
  ]);

  const handleLike = async (postId: string, isLiked: boolean) => {
    console.log(`Like action: ${postId} -> ${isLiked ? 'liked' : 'unliked'}`);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Like action completed: ${postId} -> ${isLiked ? 'liked' : 'unliked'}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Simple Like Button Test</CardTitle>
          <p className="text-sm text-muted-foreground">
            Testing basic like functionality without complex debouncing
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {testPosts.map((post) => (
            <Card key={post.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">{post.author}</p>
                  <p className="text-xs text-muted-foreground mb-2">{post.content}</p>
                  <SimpleLikeButton
                    postId={post.id}
                    initialLiked={post.initialLiked}
                    initialCount={post.initialCount}
                    onLike={handleLike}
                    size="sm"
                    showCount={true}
                  />
                </div>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleLikeTest;





















