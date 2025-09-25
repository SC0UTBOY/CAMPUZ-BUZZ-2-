import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PostActions } from '@/services/posts/postActions';
import { PostInteractionService } from '@/services/postInteractionService';
import { CheckCircle, XCircle, Clock, AlertTriangle, Heart, MessageCircle, Trash2, User } from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  details?: string;
}

export const PostInteractionTestRunner = () => {
  const [testPostId, setTestPostId] = useState<string>('');
  const [commentText, setCommentText] = useState('This is a test comment with regular text.');
  const [emojiComment, setEmojiComment] = useState('Great post! 👍😀🎉 Love it! ❤️');
  const [createdTestPostId, setCreatedTestPostId] = useState<string>('');
  const [otherUserPostId, setOtherUserPostId] = useState<string>('');
  
  const [testResults, setTestResults] = useState<TestResult[]>([
    { id: 'TC-Post-05', name: 'Verify like functionality', status: 'pending' },
    { id: 'TC-Post-06', name: 'Verify unlike functionality', status: 'pending' },
    { id: 'TC-Post-07', name: 'Verify commenting works with text', status: 'pending' },
    { id: 'TC-Post-08', name: 'Verify commenting works with emoji', status: 'pending' },
    { id: 'TC-Post-09', name: 'Verify deletion of post by owner', status: 'pending' },
    { id: 'TC-Post-10', name: 'Verify unauthorized user cannot delete post', status: 'pending' }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const updateTestResult = (id: string, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map(test => 
      test.id === id ? { ...test, ...updates } : test
    ));
  };

  const runTest = async (testId: string, testFn: () => Promise<void>) => {
    updateTestResult(testId, { status: 'running' });
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      updateTestResult(testId, { 
        status: 'passed', 
        duration,
        details: `Completed in ${duration}ms`
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult(testId, { 
        status: 'failed', 
        duration,
        error: error.message,
        details: `Failed after ${duration}ms`
      });
    }
  };

  const setupTestPost = async (): Promise<string> => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const postData = {
      content: 'Test post for interaction testing',
      title: 'Interaction Test Post',
      post_type: 'text' as const,
      user_id: user.id,
      visibility: 'public' as const,
      tags: ['test', 'interactions']
    };

    const result = await PostActions.createPost(postData);
    if (!result?.id) {
      throw new Error('Failed to create test post');
    }
    
    return result.id;
  };

  const testLikeFunctionality = async () => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    let postId = testPostId;
    if (!postId) {
      // Create a test post if none provided
      postId = await setupTestPost();
      setCreatedTestPostId(postId);
    }

    // Get initial state
    const initialPost = await PostInteractionService.getPostWithInteractions(postId);
    const initialLiked = initialPost.is_liked;
    const initialCount = initialPost.likes_count || 0;

    // Perform like action
    const result = await PostInteractionService.toggleLike(postId);

    if (initialLiked) {
      // If it was liked, it should now be unliked
      if (result.isLiked) {
        throw new Error('Expected post to be unliked, but it is still liked');
      }
      if (result.newCount >= initialCount) {
        throw new Error('Like count should have decreased');
      }
    } else {
      // If it wasn't liked, it should now be liked
      if (!result.isLiked) {
        throw new Error('Expected post to be liked, but it is not liked');
      }
      if (result.newCount <= initialCount) {
        throw new Error('Like count should have increased');
      }
    }

    toast({
      title: "TC-Post-05 Passed",
      description: `Like functionality working correctly (${result.isLiked ? 'liked' : 'unliked'})`
    });
  };

  const testUnlikeFunctionality = async () => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    let postId = testPostId || createdTestPostId;
    if (!postId) {
      postId = await setupTestPost();
      setCreatedTestPostId(postId);
    }

    // First ensure the post is liked
    const initialPost = await PostInteractionService.getPostWithInteractions(postId);
    if (!initialPost.is_liked) {
      await PostInteractionService.toggleLike(postId);
    }

    // Get state after like
    const likedPost = await PostInteractionService.getPostWithInteractions(postId);
    const likedCount = likedPost.likes_count || 0;

    // Now unlike
    const result = await PostInteractionService.toggleLike(postId);

    if (result.isLiked) {
      throw new Error('Expected post to be unliked, but it is still liked');
    }

    if (result.newCount >= likedCount) {
      throw new Error('Unlike should have decreased the count');
    }

    toast({
      title: "TC-Post-06 Passed",
      description: "Unlike functionality working correctly"
    });
  };

  const testTextCommenting = async () => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    let postId = testPostId || createdTestPostId;
    if (!postId) {
      postId = await setupTestPost();
      setCreatedTestPostId(postId);
    }

    if (!commentText.trim()) {
      throw new Error('Comment text cannot be empty');
    }

    const comment = await PostInteractionService.addComment(postId, commentText);

    if (!comment || !comment.id) {
      throw new Error('Comment was not created successfully');
    }

    if (comment.content !== commentText.trim()) {
      throw new Error('Comment content does not match input text');
    }

    if (comment.user_id !== user.id) {
      throw new Error('Comment user_id does not match current user');
    }

    toast({
      title: "TC-Post-07 Passed",
      description: "Text commenting functionality working correctly"
    });
  };

  const testEmojiCommenting = async () => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    let postId = testPostId || createdTestPostId;
    if (!postId) {
      postId = await setupTestPost();
      setCreatedTestPostId(postId);
    }

    if (!emojiComment.trim()) {
      throw new Error('Emoji comment text cannot be empty');
    }

    // Check that comment contains emojis
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    if (!emojiRegex.test(emojiComment)) {
      throw new Error('Comment should contain emoji characters for this test');
    }

    const comment = await PostInteractionService.addComment(postId, emojiComment);

    if (!comment || !comment.id) {
      throw new Error('Emoji comment was not created successfully');
    }

    if (comment.content !== emojiComment.trim()) {
      throw new Error('Emoji comment content does not match input');
    }

    // Verify emojis are preserved
    if (!emojiRegex.test(comment.content)) {
      throw new Error('Emojis were not preserved in the saved comment');
    }

    toast({
      title: "TC-Post-08 Passed",
      description: "Emoji commenting functionality working correctly"
    });
  };

  const testPostDeletionByOwner = async () => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    // Create a new post specifically for deletion testing
    const postToDelete = await setupTestPost();

    // Verify the post exists
    const postBeforeDeletion = await PostInteractionService.getPostWithInteractions(postToDelete);
    if (!postBeforeDeletion) {
      throw new Error('Test post was not created properly');
    }

    // Delete the post
    await PostInteractionService.deletePost(postToDelete);

    // Verify the post no longer exists
    try {
      await PostInteractionService.getPostWithInteractions(postToDelete);
      throw new Error('Post should have been deleted but still exists');
    } catch (error: any) {
      // This is expected - the post should not be found
      if (!error.message.includes('Post not found') && !error.message.includes('JSON object requested')) {
        throw new Error(`Unexpected error when checking deleted post: ${error.message}`);
      }
    }

    toast({
      title: "TC-Post-09 Passed",
      description: "Post deletion by owner working correctly"
    });
  };

  const testUnauthorizedDeletion = async () => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    // Use the manually specified other user's post ID
    if (!otherUserPostId) {
      throw new Error('Please specify a post ID created by another user for this test');
    }

    // Verify the post exists and is not owned by current user
    try {
      const post = await PostInteractionService.getPostWithInteractions(otherUserPostId);
      if (post.user_id === user.id) {
        throw new Error('The specified post belongs to the current user. Please specify a post from another user.');
      }
    } catch (error: any) {
      if (error.message.includes('Post not found')) {
        throw new Error('The specified post does not exist. Please provide a valid post ID from another user.');
      }
      throw error;
    }

    // Attempt to delete the post (this should fail)
    try {
      await PostInteractionService.deletePost(otherUserPostId);
      throw new Error('Deletion should have failed but succeeded - security breach!');
    } catch (error: any) {
      // This is expected - check if it's the right kind of error
      if (error.message.includes('Access denied') || 
          error.message.includes('can only delete your own posts') ||
          error.message.includes('permission')) {
        // This is the expected behavior - unauthorized deletion was prevented
        toast({
          title: "TC-Post-10 Passed",
          description: "Unauthorized deletion correctly prevented"
        });
        return;
      }
      
      // If it's a different error, the test failed
      throw new Error(`Expected access denied error, but got: ${error.message}`);
    }
  };

  const runAllTests = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to run post interaction tests",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    
    // Reset all test results
    setTestResults(prev => prev.map(test => ({ 
      ...test, 
      status: 'pending', 
      duration: undefined, 
      error: undefined,
      details: undefined
    })));

    try {
      // Run tests sequentially to avoid conflicts
      await runTest('TC-Post-05', testLikeFunctionality);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Post-06', testUnlikeFunctionality);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Post-07', testTextCommenting);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Post-08', testEmojiCommenting);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Post-09', testPostDeletionByOwner);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await runTest('TC-Post-10', testUnauthorizedDeletion);
      
    } catch (error) {
      console.error('Test runner error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      passed: 'default',
      failed: 'destructive',
      running: 'secondary',
      pending: 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const passedTests = testResults.filter(t => t.status === 'passed').length;
  const failedTests = testResults.filter(t => t.status === 'failed').length;

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Post Interaction Testing Suite
          </span>
          <div className="flex gap-2 text-sm">
            <span className="text-green-600">Passed: {passedTests}</span>
            <span className="text-red-600">Failed: {failedTests}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test Configuration</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testPostId">Test Post ID (optional - will create one if empty)</Label>
              <Input
                id="testPostId"
                value={testPostId}
                onChange={(e) => setTestPostId(e.target.value)}
                placeholder="Enter existing post ID for testing..."
              />
              <div className="text-sm text-muted-foreground">
                Leave empty to auto-create a test post
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="otherUserPostId">Other User's Post ID (required for deletion test)</Label>
              <Input
                id="otherUserPostId"
                value={otherUserPostId}
                onChange={(e) => setOtherUserPostId(e.target.value)}
                placeholder="Enter post ID from another user..."
                className="border-orange-200 focus:border-orange-500"
              />
              <div className="text-sm text-muted-foreground">
                Required for TC-Post-10: Must be a post you don't own
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commentText">Text Comment</Label>
                <Textarea
                  id="commentText"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Enter test comment text..."
                  rows={3}
                />
                <div className="text-sm text-muted-foreground">
                  Current length: {commentText.length} characters
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emojiComment">Emoji Comment</Label>
                <Textarea
                  id="emojiComment"
                  value={emojiComment}
                  onChange={(e) => setEmojiComment(e.target.value)}
                  placeholder="Enter comment with emojis..."
                  rows={3}
                />
                <div className="text-sm text-muted-foreground">
                  Contains emojis: {/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(emojiComment) ? '✅' : '❌'}
                </div>
              </div>
            </div>

            {createdTestPostId && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Created test post with ID: <code className="bg-gray-100 px-1 rounded">{createdTestPostId}</code>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <Separator />

        {/* Authentication Status */}
        {!user && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You must be logged in to run post interaction tests. Please authenticate first.
            </AlertDescription>
          </Alert>
        )}

        {/* Missing Configuration Warning */}
        {user && !otherUserPostId && (
          <Alert variant="destructive">
            <User className="h-4 w-4" />
            <AlertDescription>
              Please specify another user's post ID to test unauthorized deletion (TC-Post-10). This post must exist and be owned by a different user.
            </AlertDescription>
          </Alert>
        )}

        {/* Run Tests Button */}
        <div className="flex justify-center">
          <Button 
            onClick={runAllTests} 
            disabled={isRunning || !user}
            size="lg"
            className="w-full md:w-auto"
          >
            {isRunning ? 'Running Interaction Tests...' : 'Run All Post Interaction Tests'}
          </Button>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {testResults.map((test) => (
            <Card key={test.id} className="border-l-4 border-l-gray-200 data-[status=passed]:border-l-green-500 data-[status=failed]:border-l-red-500 data-[status=running]:border-l-blue-500" data-status={test.status}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <div className="font-medium">{test.id}: {test.name}</div>
                      {test.details && (
                        <div className="text-sm text-muted-foreground">{test.details}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {test.duration && (
                      <span className="text-sm text-muted-foreground">{test.duration}ms</span>
                    )}
                    {getStatusBadge(test.status)}
                  </div>
                </div>
                {test.error && (
                  <Alert className="mt-3" variant="destructive">
                    <AlertDescription>{test.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Test Summary */}
        {(passedTests > 0 || failedTests > 0) && (
          <Alert className={failedTests > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            <AlertDescription>
              Post Interaction Tests {failedTests > 0 ? 'Completed with Failures' : 'Passed'}: {passedTests} passed, {failedTests} failed out of {testResults.length} total tests.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};