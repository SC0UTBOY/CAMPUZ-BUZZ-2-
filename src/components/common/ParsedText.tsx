import React from 'react';
import { 
  parseTextForHashtagsAndMentions, 
  renderParsedText, 
  useHashtagMentionHandlers,
  type ParsedTextElement 
} from '@/utils/textParser';

interface ParsedTextProps {
  text: string;
  className?: string;
  onHashtagClick?: (hashtag: string) => void;
  onMentionClick?: (username: string) => void;
  enableNavigation?: boolean;
}

/**
 * Component that renders text with highlighted hashtags and mentions
 * Similar to Twitter's text rendering with clickable links
 */
export const ParsedText: React.FC<ParsedTextProps> = ({
  text,
  className = '',
  onHashtagClick,
  onMentionClick,
  enableNavigation = true
}) => {
  const { handleHashtagClick, handleMentionClick } = useHashtagMentionHandlers();
  
  // Parse the text to identify hashtags and mentions
  const parsedElements = parseTextForHashtagsAndMentions(text);
  
  // Use custom handlers if provided, otherwise use default navigation
  const hashtagHandler = onHashtagClick || (enableNavigation ? handleHashtagClick : undefined);
  const mentionHandler = onMentionClick || (enableNavigation ? handleMentionClick : undefined);
  
  // Render the parsed text
  const renderedElements = renderParsedText(parsedElements, hashtagHandler, mentionHandler);
  
  return (
    <span className={className}>
      {renderedElements}
    </span>
  );
};

/**
 * Hook to get parsed text elements for custom rendering
 * @param text - The text to parse
 * @returns Array of parsed text elements
 */
export const useParsedText = (text: string): ParsedTextElement[] => {
  return React.useMemo(() => parseTextForHashtagsAndMentions(text), [text]);
};

/**
 * Component for rendering text with hashtags and mentions in post content
 * Optimized for post cards and feed items
 */
export const PostText: React.FC<{
  content: string;
  className?: string;
}> = ({ content, className = '' }) => {
  return (
    <ParsedText
      text={content}
      className={`text-foreground leading-relaxed ${className}`}
      enableNavigation={true}
    />
  );
};

/**
 * Component for rendering text with hashtags and mentions in comments
 * Optimized for comment sections
 */
export const CommentText: React.FC<{
  content: string;
  className?: string;
}> = ({ content, className = '' }) => {
  return (
    <ParsedText
      text={content}
      className={`text-sm text-muted-foreground ${className}`}
      enableNavigation={true}
    />
  );
};





















