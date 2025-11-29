import React from 'react';

interface HashtagTextProps {
  text: string;
  className?: string;
  onHashtagClick?: (hashtag: string) => void;
  onMentionClick?: (mention: string) => void;
}

/**
 * Component to render text with Instagram-style hashtag and mention highlighting
 * Hashtags are displayed in blue (#0095F6) with hover underline and cursor pointer
 */
export const HashtagText: React.FC<HashtagTextProps> = ({
  text,
  className = '',
  onHashtagClick,
  onMentionClick
}) => {
  if (!text) return null;

  // Regex to match hashtags: # followed by letters, numbers, or underscores
  const hashtagRegex = /(#[a-zA-Z0-9_]+)/g;
  // Regex to match mentions: @ followed by letters, numbers, or underscores
  const mentionRegex = /(@[a-zA-Z0-9_]+)/g;
  // Combined regex to split text while preserving matches
  const combinedRegex = /(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g;

  const parts: Array<{ text: string; type: 'text' | 'hashtag' | 'mention' }> = [];
  let lastIndex = 0;
  let match;

  // Find all hashtags and mentions
  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({
        text: text.substring(lastIndex, match.index),
        type: 'text'
      });
    }

    // Add the match
    const matchText = match[0];
    if (matchText.startsWith('#')) {
      parts.push({
        text: matchText,
        type: 'hashtag'
      });
    } else if (matchText.startsWith('@')) {
      parts.push({
        text: matchText,
        type: 'mention'
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.substring(lastIndex),
      type: 'text'
    });
  }

  // If no hashtags/mentions found, return plain text
  if (parts.length === 1 && parts[0].type === 'text') {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'hashtag') {
          const hashtag = part.text.slice(1); // Remove #
          return (
            <span
              key={index}
              onClick={() => onHashtagClick?.(hashtag)}
              className="text-[#0095F6] hover:underline cursor-pointer font-medium transition-all duration-200"
              style={{ color: '#0095F6' }}
            >
              {part.text}
            </span>
          );
        } else if (part.type === 'mention') {
          const mention = part.text.slice(1); // Remove @
          return (
            <span
              key={index}
              onClick={() => onMentionClick?.(mention)}
              className="text-[#0095F6] hover:underline cursor-pointer font-medium transition-all duration-200"
              style={{ color: '#0095F6' }}
            >
              {part.text}
            </span>
          );
        } else {
          return <span key={index}>{part.text}</span>;
        }
      })}
    </span>
  );
};

