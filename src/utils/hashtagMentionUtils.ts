/**
 * Utility functions for hashtag and mention functionality
 * This provides reusable functions for all post components
 */

/**
 * Navigate to hashtag page
 */
export const navigateToHashtag = (hashtag: string): void => {
  const cleanHashtag = hashtag.replace(/[^a-zA-Z0-9_]/g, '');
  if (cleanHashtag) {
    window.location.href = `/hashtag/${encodeURIComponent(cleanHashtag)}`;
  }
};

/**
 * Navigate to user profile page
 */
export const navigateToProfile = (username: string): void => {
  const cleanUsername = username.replace(/[^a-zA-Z0-9_]/g, '');
  if (cleanUsername) {
    window.location.href = `/profile/${encodeURIComponent(cleanUsername)}`;
  }
};

/**
 * Extract hashtags from text
 */
export const extractHashtags = (text: string): string[] => {
  if (!text) return [];
  const matches = text.match(/#[a-zA-Z0-9_]+/g) || [];
  return matches.map(tag => tag.slice(1)); // Remove the # symbol
};

/**
 * Extract mentions from text
 */
export const extractMentions = (text: string): string[] => {
  if (!text) return [];
  const matches = text.match(/@[a-zA-Z0-9_]+/g) || [];
  return matches.map(mention => mention.slice(1)); // Remove the @ symbol
};

/**
 * Check if text contains hashtags or mentions
 */
export const hasHashtagsOrMentions = (text: string): boolean => {
  if (!text) return false;
  return /#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+/.test(text);
};

/**
 * Get hashtag and mention count
 */
export const getHashtagMentionCount = (text: string): { hashtags: number; mentions: number } => {
  if (!text) return { hashtags: 0, mentions: 0 };
  
  const hashtagMatches = text.match(/#[a-zA-Z0-9_]+/g) || [];
  const mentionMatches = text.match(/@[a-zA-Z0-9_]+/g) || [];
  
  return {
    hashtags: hashtagMatches.length,
    mentions: mentionMatches.length
  };
};

/**
 * Validate hashtag format
 */
export const isValidHashtag = (hashtag: string): boolean => {
  return /^[a-zA-Z0-9_]+$/.test(hashtag);
};

/**
 * Validate mention format
 */
export const isValidMention = (mention: string): boolean => {
  return /^[a-zA-Z0-9_]+$/.test(mention);
};

/**
 * Clean hashtag (remove invalid characters)
 */
export const cleanHashtag = (hashtag: string): string => {
  return hashtag.replace(/[^a-zA-Z0-9_]/g, '');
};

/**
 * Clean mention (remove invalid characters)
 */
export const cleanMention = (mention: string): string => {
  return mention.replace(/[^a-zA-Z0-9_]/g, '');
};

/**
 * Default CSS classes for hashtag and mention styling
 */
export const hashtagMentionClasses = {
  hashtag: "text-blue-500 hover:text-blue-600 hover:underline cursor-pointer font-medium transition-colors duration-200",
  mention: "text-blue-500 hover:text-blue-600 hover:underline cursor-pointer font-medium transition-colors duration-200",
  focus: "outline-none ring-2 ring-blue-500 ring-offset-2 rounded-sm"
};

/**
 * Dark mode CSS classes
 */
export const hashtagMentionDarkClasses = {
  hashtag: "dark:text-blue-400 dark:hover:text-blue-300",
  mention: "dark:text-blue-400 dark:hover:text-blue-300"
};









