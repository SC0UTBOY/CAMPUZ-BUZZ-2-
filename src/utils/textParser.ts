import React from 'react';

export interface ParsedTextElement {
  type: 'text' | 'hashtag' | 'mention';
  content: string;
  value?: string; // The actual hashtag/mention without # or @
}

/**
 * Parses text to identify hashtags (#example) and mentions (@username)
 * @param text - The text to parse
 * @returns Array of parsed elements
 */
export const parseTextForHashtagsAndMentions = (text: string): ParsedTextElement[] => {
  if (!text) return [];

  // Regex to match hashtags and mentions
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g; // Supports Unicode letters (including Hebrew, Arabic, etc.)
  const mentionRegex = /@[\w\u0590-\u05ff]+/g;
  
  const elements: ParsedTextElement[] = [];
  let lastIndex = 0;
  
  // Find all matches
  const allMatches: Array<{ type: 'hashtag' | 'mention'; match: RegExpExecArray }> = [];
  
  let match;
  while ((match = hashtagRegex.exec(text)) !== null) {
    allMatches.push({ type: 'hashtag', match });
  }
  
  hashtagRegex.lastIndex = 0; // Reset regex
  
  while ((match = mentionRegex.exec(text)) !== null) {
    allMatches.push({ type: 'mention', match });
  }
  
  // Sort matches by position
  allMatches.sort((a, b) => a.match.index - b.match.index);
  
  // Build elements array
  for (const { type, match } of allMatches) {
    // Add text before this match
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index);
      if (textContent) {
        elements.push({
          type: 'text',
          content: textContent
        });
      }
    }
    
    // Add the hashtag or mention
    const fullMatch = match[0];
    const value = fullMatch.slice(1); // Remove # or @
    
    elements.push({
      type,
      content: fullMatch,
      value
    });
    
    lastIndex = match.index + fullMatch.length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      elements.push({
        type: 'text',
        content: remainingText
      });
    }
  }
  
  return elements;
};

/**
 * Renders parsed text elements as React components with proper styling and links
 * @param elements - Array of parsed text elements
 * @param onHashtagClick - Callback for hashtag clicks
 * @param onMentionClick - Callback for mention clicks
 * @returns React elements
 */
export const renderParsedText = (
  elements: ParsedTextElement[],
  onHashtagClick?: (hashtag: string) => void,
  onMentionClick?: (username: string) => void
): React.ReactNode[] => {
  return elements.map((element, index) => {
    switch (element.type) {
      case 'hashtag':
        return (
          <span
            key={index}
            className="hashtag-link"
            onClick={() => onHashtagClick?.(element.value!)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onHashtagClick?.(element.value!);
              }
            }}
          >
            {element.content}
          </span>
        );
      
      case 'mention':
        return (
          <span
            key={index}
            className="mention-link"
            onClick={() => onMentionClick?.(element.value!)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onMentionClick?.(element.value!);
              }
            }}
          >
            {element.content}
          </span>
        );
      
      default:
        return <span key={index}>{element.content}</span>;
    }
  });
};

/**
 * Hook to handle hashtag and mention clicks with navigation
 * @returns Object with click handlers
 */
export const useHashtagMentionHandlers = () => {
  const handleHashtagClick = (hashtag: string) => {
    // Navigate to hashtag page
    window.location.href = `/hashtag/${encodeURIComponent(hashtag)}`;
  };

  const handleMentionClick = (username: string) => {
    // Navigate to user profile page
    window.location.href = `/profile/${encodeURIComponent(username)}`;
  };

  return {
    handleHashtagClick,
    handleMentionClick
  };
};

/**
 * Utility function to extract hashtags and mentions from text
 * @param text - The text to extract from
 * @returns Object with arrays of hashtags and mentions
 */
export const extractHashtagsAndMentions = (text: string) => {
  const hashtags = text.match(/#[\w\u0590-\u05ff]+/g)?.map(tag => tag.slice(1)) || [];
  const mentions = text.match(/@[\w\u0590-\u05ff]+/g)?.map(mention => mention.slice(1)) || [];
  
  return { hashtags, mentions };
};
