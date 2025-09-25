import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Smile } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface EnhancedCommentFormProps {
  onSubmit: (content: string) => void;
  isSubmitting?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

/**
 * Enhanced comment form with better UX and keyboard shortcuts
 */
export const EnhancedCommentForm: React.FC<EnhancedCommentFormProps> = ({
  onSubmit,
  isSubmitting = false,
  placeholder = "Write a comment...",
  className,
  autoFocus = false
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    await onSubmit(content.trim());
    setContent('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  if (!user) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p className="text-sm">Please log in to comment on posts.</p>
      </div>
    );
  }

  const isDisabled = !content.trim() || isSubmitting;
  const characterCount = content.length;
  const maxLength = 1000;

  return (
    <form onSubmit={handleSubmit} className={cn("flex space-x-3", className)}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={user.user_metadata?.avatar_url} />
        <AvatarFallback>
          {user.email?.charAt(0)?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-2">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={cn(
              "min-h-[40px] max-h-[120px] resize-none transition-all duration-200",
              isFocused && "ring-2 ring-blue-500 ring-offset-2",
              isSubmitting && "opacity-50"
            )}
            disabled={isSubmitting}
            maxLength={maxLength}
          />
          
          {/* Character count */}
          {isFocused && (
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-1 rounded">
              {characterCount}/{maxLength}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-xs text-muted-foreground">
              Press Enter to post, Shift+Enter for new line
            </div>
            {characterCount > maxLength * 0.8 && (
              <div className={cn(
                "text-xs",
                characterCount > maxLength * 0.9 ? "text-orange-500" : "text-muted-foreground"
              )}>
                {maxLength - characterCount} characters left
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              disabled={isSubmitting}
            >
              <Smile className="h-4 w-4" />
            </Button>
            
            <Button 
              type="submit" 
              size="sm" 
              disabled={isDisabled}
              className={cn(
                "flex items-center space-x-1 transition-all duration-200",
                isDisabled 
                  ? "opacity-50 cursor-not-allowed" 
                  : "hover:bg-blue-600 hover:text-white"
              )}
            >
              <Send className="h-3 w-3" />
              <span>{isSubmitting ? 'Posting...' : 'Comment'}</span>
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default EnhancedCommentForm;









