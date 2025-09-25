import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, CheckCircle, Zap, Shield, Clock } from 'lucide-react';
import { EnhancedLikeButton } from '@/components/posts/EnhancedLikeButton';
import { useEnhancedLikes } from '@/hooks/useEnhancedLikes';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

/**
 * Test component to demonstrate enhanced like button functionality
 */
export const LikeButtonTest: React.FC = () => {
  const { toggleLike } = useEnhancedLikes();
  const [testPosts] = useState([
    {
      id: 'test-1',
      content: 'This is a test post to demonstrate the enhanced like functionality! #testing #likes',
      author: 'Test User 1',
      initialLiked: false,
      initialCount: 5
    },
    {
      id: 'test-2', 
      content: 'Another test post with different like states. @testuser #demo',
      author: 'Test User 2',
      initialLiked: true,
      initialCount: 12
    },
    {
      id: 'test-3',
      content: 'Testing rapid clicking prevention and debouncing! #performance',
      author: 'Test User 3',
      initialLiked: false,
      initialCount: 0
    }
  ]);

  const features = [
    '✅ Real-time state updates without page reload',
    '✅ Heart icon changes color (red when liked, gray when unliked)',
    '✅ Like count updates immediately with optimistic updates',
    '✅ Debounced API calls prevent rapid clicking issues',
    '✅ Backend synchronization with POST/DELETE /like endpoints',
    '✅ Visual feedback with hover effects and animations',
    '✅ Error handling with automatic state reversion',
    '✅ Keyboard accessibility (Tab + Enter/Space)',
    '✅ Loading states and disabled states during API calls',
    '✅ Prevents duplicate actions and race conditions'
  ];

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
            <Heart className="h-6 w-6" />
            Enhanced Like Button Test
          </CardTitle>
          <p className="text-green-800 dark:text-green-200">
            Test the enhanced like functionality with Twitter/Facebook-like behavior
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Test Posts
              </h4>
              <div className="space-y-3">
                {testPosts.map((post) => (
                  <Card key={post.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">{post.author}</p>
                        <p className="text-xs text-muted-foreground mb-2">{post.content}</p>
                        <EnhancedLikeButton
                          postId={post.id}
                          initialLiked={post.initialLiked}
                          initialCount={post.initialCount}
                          onLike={toggleLike}
                          size="sm"
                          showCount={true}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Features Implemented
              </h4>
              <div className="space-y-1">
                {features.map((feature, index) => (
                  <p key={index} className="text-sm text-green-800 dark:text-green-200">
                    {feature}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              How to Test
            </h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p>1. <strong>Click the heart icons</strong> to like/unlike posts</p>
              <p>2. <strong>Watch the count update</strong> in real-time</p>
              <p>3. <strong>Try rapid clicking</strong> - it's debounced to prevent issues</p>
              <p>4. <strong>Hover over hearts</strong> to see color transitions</p>
              <p>5. <strong>Use Tab + Enter/Space</strong> for keyboard navigation</p>
              <p>6. <strong>Check browser network tab</strong> to see API calls</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Technical Details
            </h4>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <p>• <strong>Debounce:</strong> 300ms for UI, 500ms for API calls</p>
              <p>• <strong>Optimistic Updates:</strong> Immediate UI feedback</p>
              <p>• <strong>Error Handling:</strong> Automatic state reversion on failure</p>
              <p>• <strong>Race Condition Prevention:</strong> Pending action tracking</p>
              <p>• <strong>Database Triggers:</strong> Automatic like count updates</p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </ErrorBoundary>
  );
};

export default LikeButtonTest;
