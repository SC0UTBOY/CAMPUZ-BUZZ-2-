/**
 * Extract hashtags from text
 * Hashtag format: # followed by letters, numbers, or underscores
 * Returns lowercase hashtags without the # symbol
 */
export function extractHashtags(text: string): string[] {
  if (!text) return [];
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const matches = Array.from(text.matchAll(hashtagRegex));
  const hashtags = matches.map(match => match[1].toLowerCase());
  // Remove duplicates
  return [...new Set(hashtags)];
}

/**
 * Extract mentions from text
 */
export function extractMentions(text: string): string[] {
  if (!text) return [];
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const matches = Array.from(text.matchAll(mentionRegex));
  return matches.map(match => match[1].toLowerCase());
}

/**
 * Process text to convert hashtags and mentions into HTML spans with Instagram-style styling
 */
export function renderTextWithHashtagsAndMentions(text: string): string {
  if (!text) return '';
  
  // Regex to match hashtags and mentions
  const combinedRegex = /(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g;
  
  return text.replace(combinedRegex, (match) => {
    if (match.startsWith('#')) {
      // Instagram-style hashtag: blue color #0095F6, hover underline, cursor pointer
      return `<span class="hashtag-link" style="color: #0095F6; cursor: pointer; font-weight: 500;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${match}</span>`;
    } else if (match.startsWith('@')) {
      return `<span class="mention-link" style="color: #0095F6; cursor: pointer; font-weight: 500;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${match}</span>`;
    }
    return match;
  });
}
