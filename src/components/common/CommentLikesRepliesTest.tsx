import React, { useState } from 'react';
import { EnhancedCommentsSectionWithLikes } from '@/components/comments/EnhancedCommentsSectionWithLikes';
import { CommentsService } from '@/services/commentsService';
import { CommentLikesService } from '@/services/commentLikesService';
import { CommentRepliesService } from '@/services/commentRepliesService';

export const CommentLikesRepliesTest: React.FC = () => {
  const [testPostId, setTestPostId] = useState('test-post-123');
  const [testCommentId, setTestCommentId] = useState('');
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    try {
      const results: any = {};

      // Test 1: Create a test comment
      try {
        const comment = await CommentsService.createComment({
          post_id: testPostId,
          content: 'This is a test comment for likes and replies functionality!'
        });
        setTestCommentId(comment.id);
        results.commentCreated = { success: true, comment };
      } catch (error) {
        results.commentCreated = { success: false, error: error.message };
      }

      // Test 2: Like the comment
      if (testCommentId) {
        try {
          const likeResult = await CommentLikesService.toggleLike(testCommentId);
          results.commentLiked = { success: true, result: likeResult };
        } catch (error) {
          results.commentLiked = { success: false, error: error.message };
        }
      }

      // Test 3: Create a reply
      if (testCommentId) {
        try {
          const reply = await CommentRepliesService.createReply({
            comment_id: testCommentId,
            text: 'This is a test reply!'
          });
          results.replyCreated = { success: true, reply };
        } catch (error) {
          results.replyCreated = { success: false, error: error.message };
        }
      }

      // Test 4: Get comment with likes and replies
      if (testCommentId) {
        try {
          const commentsWithData = await CommentsService.getCommentsWithLikesAndReplies(testPostId);
          results.commentsWithData = { success: true, comments: commentsWithData };
        } catch (error) {
          results.commentsWithData = { success: false, error: error.message };
        }
      }

      setTestResults(results);
    } catch (error) {
      setTestResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-4">Comment Likes & Replies Test</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Test Post ID:</label>
            <input
              type="text"
              value={testPostId}
              onChange={(e) => setTestPostId(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="Enter post ID for testing"
            />
          </div>

          <button
            onClick={runTests}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Running Tests...' : 'Run Tests'}
          </button>

          {testResults && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Test Results:</h4>
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Live Demo */}
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-4">Live Demo</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Try creating comments, liking them, and adding replies in real-time!
        </p>
        
        <EnhancedCommentsSectionWithLikes
          postId={testPostId}
          showCommentForm={true}
          maxComments={10}
          maxReplies={3}
        />
      </div>
    </div>
  );
};





















