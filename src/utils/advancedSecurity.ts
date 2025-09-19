
import { z } from 'zod';
import { createRateLimiter } from '@/utils/enhancedSecurityValidation';

// Advanced content filtering patterns
const SUSPICIOUS_PATTERNS = [
  /\b(eval|function|constructor)\s*\(/gi,
  /javascript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /vbscript\s*:/gi,
  /<\s*script[^>]*>/gi,
  /<\s*iframe[^>]*>/gi,
  /on\w+\s*=/gi,
  /expression\s*\(/gi
];

const SQL_INJECTION_PATTERNS = [
  /('|(\\')|(;)|(\\;)|(\/\*)|(\\\/\*))/gi,
  /(union|select|insert|update|delete|drop|create|alter|exec|execute)/gi,
  /(-{2}|#{1}|\/\*|\*\/)/gi
];

// Advanced input sanitization
export const advancedSanitizeInput = (input: string, options: {
  allowHTML?: boolean;
  maxLength?: number;
  stripSQLPatterns?: boolean;
} = {}): { sanitized: string; threats: string[] } => {
  const { allowHTML = false, maxLength = 10000, stripSQLPatterns = true } = options;
  const threats: string[] = [];
  let sanitized = input;

  // Check for suspicious patterns
  SUSPICIOUS_PATTERNS.forEach(pattern => {
    if (pattern.test(sanitized)) {
      threats.push('Potential XSS attempt detected');
      sanitized = sanitized.replace(pattern, '[REMOVED]');
    }
  });

  // Check for SQL injection patterns
  if (stripSQLPatterns) {
    SQL_INJECTION_PATTERNS.forEach(pattern => {
      if (pattern.test(sanitized)) {
        threats.push('Potential SQL injection attempt detected');
        sanitized = sanitized.replace(pattern, '[REMOVED]');
      }
    });
  }

  // Basic HTML sanitization if not allowed
  if (!allowHTML) {
    sanitized = sanitized
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Length check
  if (sanitized.length > maxLength) {
    threats.push('Input exceeds maximum length');
    sanitized = sanitized.substring(0, maxLength);
  }

  return { sanitized, threats };
};

// Content Security Policy helpers
export const getSecurityHeaders = () => ({
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' wss: https:",
    "frame-ancestors 'none'"
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
});

// Advanced rate limiting with different tiers
export const createTieredRateLimit = () => {
  const standardLimit = createRateLimiter(30, 60000); // 30 requests per minute
  const strictLimit = createRateLimiter(10, 60000);   // 10 requests per minute
  const premiumLimit = createRateLimiter(100, 60000); // 100 requests per minute

  return {
    checkLimit: (identifier: string, tier: 'standard' | 'strict' | 'premium' = 'standard') => {
      switch (tier) {
        case 'strict':
          return strictLimit.checkLimit(identifier);
        case 'premium':
          return premiumLimit.checkLimit(identifier);
        default:
          return standardLimit.checkLimit(identifier);
      }
    },
    getRemainingAttempts: (identifier: string, tier: 'standard' | 'strict' | 'premium' = 'standard') => {
      switch (tier) {
        case 'strict':
          return strictLimit.getRemainingAttempts(identifier);
        case 'premium':
          return premiumLimit.getRemainingAttempts(identifier);
        default:
          return standardLimit.getRemainingAttempts(identifier);
      }
    }
  };
};

// Comprehensive input validation schema
export const advancedValidationSchemas = {
  post: z.object({
    title: z.string()
      .min(1, "Title is required")
      .max(200, "Title too long")
      .refine(val => !SUSPICIOUS_PATTERNS.some(pattern => pattern.test(val)), "Invalid content detected"),
    content: z.string()
      .min(1, "Content is required")
      .max(5000, "Content too long")
      .refine(val => !SUSPICIOUS_PATTERNS.some(pattern => pattern.test(val)), "Invalid content detected"),
    tags: z.array(z.string().max(50)).max(10, "Too many tags").optional()
  }),
  
  profile: z.object({
    display_name: z.string()
      .min(1, "Display name is required")
      .max(100, "Display name too long")
      .refine(val => !SUSPICIOUS_PATTERNS.some(pattern => pattern.test(val)), "Invalid content detected"),
    bio: z.string()
      .max(500, "Bio too long")
      .refine(val => !SUSPICIOUS_PATTERNS.some(pattern => pattern.test(val)), "Invalid content detected")
      .optional(),
    major: z.string().max(100).optional(),
    school: z.string().max(200).optional()
  })
};
