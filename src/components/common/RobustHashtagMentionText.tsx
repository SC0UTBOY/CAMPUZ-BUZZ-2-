import React from 'react';
import { navigateToHashtag, navigateToProfile, hashtagMentionClasses } from '@/utils/hashtagMentionUtils';

interface RobustHashtagMentionTextProps {
  text: string;
  className?: string;
}

/**
 * Robust component that renders text with clickable hashtags and mentions
 * Handles all edge cases and React rendering issues
 */
export const RobustHashtagMentionText: React.FC<RobustHashtagMentionTextProps> = ({ 
  text, 
  className = '' 
}) => {
  // Function to handle hashtag clicks
  const handleHashtagClick = (hashtag: string) => {
    navigateToHashtag(hashtag);
  };

  // Function to handle mention clicks
  const handleMentionClick = (username: string) => {
    navigateToProfile(username);
  };

  // Function to parse and render text with hashtags and mentions
  const renderTextWithLinks = (inputText: string): React.ReactNode[] => {
    if (!inputText || typeof inputText !== 'string') {
      return [<span key="empty"> </span>];
    }

    // Use regex to find hashtags and mentions while preserving the original text
    const regex = /(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+|\s+|[^\s#@]+)/g;
    const matches = inputText.match(regex) || [];
    
    return matches.map((match, index) => {
      // Handle hashtags
      if (match.startsWith('#') && match.length > 1) {
        const hashtag = match.slice(1);
        return (
          <span
            key={`hashtag-${index}`}
            className={hashtagMentionClasses.hashtag}
            onClick={() => handleHashtagClick(hashtag)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleHashtagClick(hashtag);
              }
            }}
          >
            {match}
          </span>
        );
      }
      
      // Handle mentions
      if (match.startsWith('@') && match.length > 1) {
        const username = match.slice(1);
        return (
          <span
            key={`mention-${index}`}
            className={hashtagMentionClasses.mention}
            onClick={() => handleMentionClick(username)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleMentionClick(username);
              }
            }}
          >
            {match}
          </span>
        );
      }
      
      // Handle regular text and whitespace
      return (
        <span key={`text-${index}`}>
          {match}
        </span>
      );
    });
  };

  return (
    <span className={className}>
      {renderTextWithLinks(text)}
    </span>
  );
};

export default RobustHashtagMentionText;
