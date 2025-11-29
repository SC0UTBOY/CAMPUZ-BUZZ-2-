
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CommentFormProps {
  onSubmit: (content: string) => void;
  isSubmitting?: boolean;
  placeholder?: string;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  isSubmitting = false,
  placeholder = "Write a comment..."
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    await onSubmit(content.trim());
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Please log in to comment on posts.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex space-x-3">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={user.user_metadata?.avatar_url} />
        <AvatarFallback>
          {user.email?.charAt(0)?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[80px] resize-none"
          disabled={isSubmitting}
        />
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Press Cmd/Ctrl + Enter to post quickly
          </div>
          
          <Button 
            type="submit" 
            size="sm" 
            disabled={!content.trim() || isSubmitting}
            className="flex items-center space-x-1"
          >
            <Send className="h-3 w-3" />
            <span>{isSubmitting ? 'Posting...' : 'Comment'}</span>
          </Button>
        </div>
      </div>
    </form>
  );
};
