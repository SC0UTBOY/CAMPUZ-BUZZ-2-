
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, X } from 'lucide-react';

interface CommentEditFormProps {
  initialContent: string;
  onSubmit: (content: string) => void;
  onCancel: () => void;
}

export const CommentEditForm: React.FC<CommentEditFormProps> = ({
  initialContent,
  onSubmit,
  onCancel
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
    } catch (error) {
      console.error('Error updating comment:', error);
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
        className="min-h-[60px] resize-none"
        autoFocus
      />
      <div className="flex items-center space-x-2">
        <Button 
          type="submit" 
          size="sm" 
          disabled={!content.trim() || isSubmitting || content === initialContent}
          className="flex items-center space-x-1"
        >
          <Save className="h-3 w-3" />
          <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
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
    </form>
  );
};
