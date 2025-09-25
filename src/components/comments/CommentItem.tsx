
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Comment } from '@/services/commentsService';
import { useAuth } from '@/contexts/AuthContext';
import { CommentReplyForm } from './CommentReplyForm';
import { CommentEditForm } from './CommentEditForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommentItemProps {
  comment: Comment;
  onReply?: (parentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  onUpdate?: (commentId: string, content: string) => void;
  onLike?: (commentId: string) => void;
  depth?: number;
  maxDepth?: number;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onDelete,
  onUpdate,
  onLike,
  depth = 0,
  maxDepth = 3
}) => {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(depth < 2); // Auto-expand first two levels

  const isOwner = user?.id === comment.user_id;
  const canReply = depth < maxDepth;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleReply = (content: string) => {
    if (onReply) {
      onReply(comment.id, content);
      setShowReplyForm(false);
    }
  };

  const handleUpdate = (content: string) => {
    if (onUpdate) {
      onUpdate(comment.id, content);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this comment?')) {
      onDelete(comment.id);
    }
  };

  const handleLike = () => {
    if (onLike) {
      onLike(comment.id);
    }
  };

  return (
    <div className={`flex space-x-3 ${depth > 0 ? 'ml-8 mt-3' : 'mt-4'}`}>
      <Avatar className={`${depth > 0 ? 'h-8 w-8' : 'h-10 w-10'} flex-shrink-0`}>
        <AvatarImage src={comment.profiles?.avatar_url} />
        <AvatarFallback>
          {comment.profiles?.display_name?.charAt(0)?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* Comment Header */}
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-semibold text-sm text-foreground">
            {comment.profiles?.display_name || 'Anonymous User'}
          </span>
          {comment.profiles?.major && (
            <Badge variant="secondary" className="text-xs">
              {comment.profiles.major}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
          {comment.updated_at !== comment.created_at && (
            <span className="text-xs text-muted-foreground italic">
              (edited)
            </span>
          )}
        </div>

        {/* Comment Content */}
        <div className="mb-2">
          {isEditing ? (
            <CommentEditForm
              initialContent={comment.content}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div className="text-sm text-foreground whitespace-pre-wrap break-words">
              {comment.content}
            </div>
          )}
        </div>

        {/* Comment Actions */}
        <div className="flex items-center space-x-4 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className="text-muted-foreground hover:text-red-500 h-6 p-1"
          >
            <Heart className="h-3 w-3 mr-1" />
            <span className="text-xs">{comment.likes_count || 0}</span>
          </Button>

          {canReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-muted-foreground hover:text-blue-500 h-6 p-1"
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              <span className="text-xs">Reply</span>
            </Button>
          )}

          {hasReplies && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplies(!showReplies)}
              className="text-muted-foreground hover:text-foreground h-6 p-1"
            >
              <span className="text-xs">
                {showReplies ? 'Hide' : 'Show'} {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
              </span>
            </Button>
          )}

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-3">
            <CommentReplyForm
              onSubmit={handleReply}
              onCancel={() => setShowReplyForm(false)}
              placeholder={`Reply to ${comment.profiles?.display_name || 'this comment'}...`}
            />
          </div>
        )}

        {/* Nested Replies */}
        {hasReplies && showReplies && (
          <div className="mt-2">
            {comment.replies?.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onDelete={onDelete}
                onUpdate={onUpdate}
                onLike={onLike}
                depth={depth + 1}
                maxDepth={maxDepth}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
