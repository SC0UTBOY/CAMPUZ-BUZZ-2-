
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, X } from 'lucide-react';

interface CommentReplyFormProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
  placeholder?: string;
  initialContent?: string;
}

export const CommentReplyForm: React.FC<CommentReplyFormProps> = ({
  onSubmit,
  onCancel,
  placeholder = "Write a reply...",
  initialContent = ""
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e as any);
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[80px] resize-none"
        autoFocus
      />
      <div className="flex items-center space-x-2">
        <Button 
          type="submit" 
          size="sm" 
          disabled={!content.trim() || isSubmitting}
          className="flex items-center space-x-1"
        >
          <Send className="h-3 w-3" />
          <span>{isSubmitting ? 'Posting...' : 'Reply'}</span>
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={onCancel}
          className="flex items-center space-x-1"
        >
          <X className="h-3 w-3" />
          <span>Cancel</span>
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">
        Press Cmd/Ctrl + Enter to post quickly
      </div>
    </form>
  );
};
