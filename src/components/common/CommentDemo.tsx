import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, User, Clock } from 'lucide-react';
import { EnhancedCommentForm } from '@/components/comments/EnhancedCommentForm';
import { formatDistanceToNow } from 'date-fns';

/**
 * Simple demo component showing comment functionality
 */
export const CommentDemo: React.FC = () => {
  const [comments, setComments] = useState([
    {
      id: '1',
      content: 'This is a great post! Thanks for sharing. #awesome @everyone',
      author: 'Alice Johnson',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      likes: 3
    },
    {
      id: '2',
      content: 'I totally agree with this perspective. The insights are really valuable.',
      author: 'Bob Smith',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      likes: 1
    }
  ]);

  const handleAddComment = (content: string) => {
    const newComment = {
      id: Date.now().toString(),
      content,
      author: 'You',
      timestamp: new Date().toISOString(),
      likes: 0
    };
    setComments(prev => [newComment, ...prev]);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Sample Post
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            "Just had an amazing experience at the tech conference! The keynote speaker shared some incredible insights about the future of AI and machine learning. Can't wait to implement these ideas in our next project. #tech #AI #conference"
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>👍 24 likes</span>
            <span>💬 {comments.length} comments</span>
            <span>🔄 5 shares</span>
          </div>
        </CardContent>
      </Card>

      {/* Comment Form */}
      <Card>
        <CardContent className="p-4">
          <EnhancedCommentForm
            onSubmit={handleAddComment}
            isSubmitting={false}
            placeholder="Add a comment..."
            autoFocus={false}
          />
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {comment.author.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-sm">{comment.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-muted-foreground">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      <span className="text-xs">{comment.likes}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-muted-foreground">
                      <span className="text-xs">Reply</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {comments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CommentDemo;









