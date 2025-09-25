
// Content sanitization utilities to prevent XSS attacks

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'blockquote'];
const ALLOWED_ATTRIBUTES = {
  'a': ['href', 'title'],
  '*': ['class']
};

// Basic HTML sanitization - strips dangerous tags and attributes
export const sanitizeHTML = (html: string): string => {
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/\son\w+="[^"]*"/gi, '');
  sanitized = sanitized.replace(/\son\w+='[^']*'/gi, '');
  
  // Remove data: URLs (except for safe data types)
  sanitized = sanitized.replace(/data:(?!image\/(png|jpeg|gif|webp))/gi, '');
  
  // Remove style attributes that could contain expressions
  sanitized = sanitized.replace(/style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi, '');
  
  return sanitized;
};

// Sanitize text content for display (escape HTML entities)
export const sanitizeText = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Sanitize URLs to prevent malicious schemes
export const sanitizeURL = (url: string): string => {
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return '';
    }
  }
  
  // Only allow http, https, and mailto
  if (!trimmed.startsWith('http://') && 
      !trimmed.startsWith('https://') && 
      !trimmed.startsWith('mailto:')) {
    return `https://${url}`;
  }
  
  return url;
};

// Extract and validate mentions from content
export const extractMentions = (content: string): string[] => {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    const mention = match[1];
    if (mention.length <= 50 && /^[a-zA-Z0-9_]+$/.test(mention)) {
      mentions.push(mention);
    }
  }
  
  return [...new Set(mentions)]; // Remove duplicates
};

// Extract and validate hashtags from content
export const extractHashtags = (content: string): string[] => {
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const hashtags: string[] = [];
  let match;
  
  while ((match = hashtagRegex.exec(content)) !== null) {
    const hashtag = match[1];
    if (hashtag.length <= 50 && /^[a-zA-Z0-9_]+$/.test(hashtag)) {
      hashtags.push(hashtag.toLowerCase());
    }
  }
  
  return [...new Set(hashtags)]; // Remove duplicates
};

// Sanitize filename for upload
export const sanitizeFilename = (filename: string): string => {
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '');
  
  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"/\\|?*]/g, '_');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    const name = sanitized.substring(0, 255 - ext.length - 1);
    sanitized = `${name}.${ext}`;
  }
  
  return sanitized;
};

// Rate limiting helper (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, maxRequests: number, windowMs: number): boolean => {
  const now = Date.now();
  const userLimits = rateLimitMap.get(key);
  
  if (!userLimits || now > userLimits.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimits.count >= maxRequests) {
    return false;
  }
  
  userLimits.count++;
  return true;
};

// Clean up expired rate limit entries
export const cleanupRateLimits = () => {
  const now = Date.now();
  for (const [key, limits] of rateLimitMap.entries()) {
    if (now > limits.resetTime) {
      rateLimitMap.delete(key);
    }
  }
};

// Set up periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(cleanupRateLimits, 60000); // Cleanup every minute
}
