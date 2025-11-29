import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, CheckCircle, Zap, Shield, Clock, User, Send } from 'lucide-react';
import { EnhancedCommentsSection } from '@/components/comments/EnhancedCommentsSection';
import { EnhancedCommentForm } from '@/components/comments/EnhancedCommentForm';

/**
 * Comprehensive test component for comment functionality
 */
export const CommentTest: React.FC = () => {
  const [testPostId] = useState('test-post-123');
  const [testComments, setTestComments] = useState([
    {
      id: 'comment-1',
      content: 'This is a test comment! #testing @everyone',
      author: 'Test User 1',
      timestamp: new Date().toISOString(),
      likes: 5
    },
    {
      id: 'comment-2', 
      content: 'Another comment with some longer text to test the layout and see how it handles multiple lines of content.',
      author: 'Test User 2',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      likes: 2
    }
  ]);

  const handleTestComment = (content: string) => {
    console.log('Test comment submitted:', content);
    // Simulate adding comment
    const newComment = {
      id: `comment-${Date.now()}`,
      content,
      author: 'Current User',
      timestamp: new Date().toISOString(),
      likes: 0
    };
    setTestComments(prev => [...prev, newComment]);
  };

  const features = [
    '✅ Real-time comment submission with Enter key',
    '✅ Send button disabled for empty comments',
    '✅ Username and timestamp display',
    '✅ Comment persistence after reload',
    '✅ Optimistic UI updates',
    '✅ Error handling and reversion',
    '✅ Character count and validation',
    '✅ Auto-resize textarea',
    '✅ Keyboard shortcuts (Enter to submit, Shift+Enter for new line)',
    '✅ Loading states and disabled states',
    '✅ Backend API integration (POST /posts/:id/comments)',
    '✅ Comment fetching (GET /posts/:id/comments)',
    '✅ Hashtag and mention support in comments',
    '✅ Nested replies (up to 3 levels)',
    '✅ Edit and delete functionality',
    '✅ Like comments functionality'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
            <MessageCircle className="h-6 w-6" />
            Comment System Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 text-green-800 dark:text-green-200">
                Features Implemented
              </h3>
              <div className="space-y-1">
                {features.map((feature, index) => (
                  <div key={index} className="text-sm text-green-700 dark:text-green-300">
                    {feature}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 text-green-800 dark:text-green-200">
                Test Instructions
              </h3>
              <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                <p>1. <strong>Type a comment</strong> in the text area below</p>
                <p>2. <strong>Press Enter</strong> to submit (or click Send)</p>
                <p>3. <strong>Try empty comments</strong> - Send button should be disabled</p>
                <p>4. <strong>Test Shift+Enter</strong> for new lines</p>
                <p>5. <strong>Check character count</strong> (max 1000 characters)</p>
                <p>6. <strong>Test hashtags and mentions</strong> in comments</p>
                <p>7. <strong>Reload the page</strong> to test persistence</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Post with Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Test Post
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            This is a test post to demonstrate the comment functionality. Try commenting below!
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                "This is a sample post content. It demonstrates how comments work in our social feed. 
                You can add comments with hashtags like #testing and mentions like @username. 
                The comment system supports real-time updates, threading, and all the features you'd expect from a modern social platform."
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>👍 12 likes</span>
              <span>💬 {testComments.length} comments</span>
              <span>🔄 3 shares</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Comments Section */}
      <EnhancedCommentsSection
        postId={testPostId}
        initialCommentsCount={testComments.length}
        compact={false}
      />

      {/* Standalone Comment Form Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Standalone Comment Form Test
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Test the comment form in isolation
          </p>
        </CardHeader>
        <CardContent>
          <EnhancedCommentForm
            onSubmit={handleTestComment}
            isSubmitting={false}
            placeholder="Test the comment form here..."
            autoFocus={false}
          />
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Technical Implementation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Frontend Features</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• React hooks for state management</li>
                <li>• TanStack Query for data fetching</li>
                <li>• Optimistic UI updates</li>
                <li>• Real-time comment updates</li>
                <li>• Keyboard shortcuts and accessibility</li>
                <li>• Auto-resize textarea</li>
                <li>• Character count and validation</li>
                <li>• Loading and error states</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Backend Integration</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• POST /posts/:id/comments</li>
                <li>• GET /posts/:id/comments</li>
                <li>• PUT /comments/:id (edit)</li>
                <li>• DELETE /comments/:id</li>
                <li>• Supabase real-time subscriptions</li>
                <li>• Database triggers for counts</li>
                <li>• User authentication checks</li>
                <li>• Comment threading support</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommentTest;





















