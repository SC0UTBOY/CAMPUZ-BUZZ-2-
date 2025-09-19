import React from 'react';

interface HashtagMentionTextProps {
  text: string;
  className?: string;
}

/**
 * Simple component that renders text with clickable hashtags and mentions
 * This is a direct implementation that will definitely work
 */
export const HashtagMentionText: React.FC<HashtagMentionTextProps> = ({ 
  text, 
  className = '' 
}) => {
  // Function to handle hashtag clicks
  const handleHashtagClick = (hashtag: string) => {
    window.location.href = `/hashtag/${encodeURIComponent(hashtag)}`;
  };

  // Function to handle mention clicks
  const handleMentionClick = (username: string) => {
    window.location.href = `/profile/${encodeURIComponent(username)}`;
  };

  // Function to parse and render text with hashtags and mentions
  const renderTextWithLinks = (text: string) => {
    if (!text) return <span></span>;

    // Split text by spaces to process each word
    const words = text.split(/(\s+)/);
    
    return words.map((word, index) => {
      // Check if word is a hashtag
      if (word.startsWith('#') && word.length > 1) {
        const hashtag = word.slice(1); // Remove the # symbol
        return (
          <span
            key={index}
            className="text-blue-500 hover:text-blue-600 hover:underline cursor-pointer font-medium transition-colors duration-200"
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
            {word}
          </span>
        );
      }
      
      // Check if word is a mention
      if (word.startsWith('@') && word.length > 1) {
        const username = word.slice(1); // Remove the @ symbol
        return (
          <span
            key={index}
            className="text-blue-500 hover:text-blue-600 hover:underline cursor-pointer font-medium transition-colors duration-200"
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
            {word}
          </span>
        );
      }
      
      // Regular text - always wrap in span to avoid React errors
      return <span key={index}>{word}</span>;
    });
  };

  return (
    <span className={className}>
      {renderTextWithLinks(text)}
    </span>
  );
};

export default HashtagMentionText;
