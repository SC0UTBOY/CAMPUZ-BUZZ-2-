
import { z } from 'zod';

// Enhanced security validation utilities

// Password strength validation with detailed requirements
export const PasswordStrengthSchema = z.string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password cannot exceed 128 characters")
  .refine((password) => /[a-z]/.test(password), "Password must contain at least one lowercase letter")
  .refine((password) => /[A-Z]/.test(password), "Password must contain at least one uppercase letter")
  .refine((password) => /[0-9]/.test(password), "Password must contain at least one number")
  .refine((password) => /[^A-Za-z0-9]/.test(password), "Password must contain at least one special character")
  .refine((password) => !/(.)\1{2,}/g.test(password), "Password cannot contain repeated characters")
  .refine((password) => {
    const commonPasswords = ['password', '123456', 'admin', 'user', 'test'];
    return !commonPasswords.some(common => password.toLowerCase().includes(common));
  }, "Password cannot contain common patterns");

// Email validation with educational domain checking
export const EducationalEmailSchema = z.string()
  .email("Invalid email format")
  .refine((email) => {
    const educationalDomains = ['.edu', '.ac.', '.university', '.college'];
    return educationalDomains.some(domain => email.toLowerCase().includes(domain)) || 
           process.env.NODE_ENV === 'development'; // Allow any email in development
  }, "Please use your educational institution email address");

// Role validation
export const UserRoleSchema = z.enum(['student', 'faculty', 'admin', 'moderator'], {
  errorMap: () => ({ message: "Invalid user role" })
});

// Content validation with additional security checks
export const SecureContentSchema = z.string()
  .max(10000, "Content exceeds maximum length")
  .refine((content) => {
    // Check for potential code injection attempts
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /onclick\s*=/gi,
      /onmouseover\s*=/gi,
      /eval\s*\(/gi,
      /document\.cookie/gi,
      /window\.location/gi
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(content));
  }, "Content contains potentially unsafe elements")
  .refine((content) => {
    // Check for excessive special characters (potential obfuscation)
    const specialCharCount = (content.match(/[^\w\s.,!?;:()\-"']/g) || []).length;
    const totalLength = content.length;
    return totalLength === 0 || (specialCharCount / totalLength) < 0.3;
  }, "Content contains excessive special characters");

// File upload validation
export const SecureFileSchema = z.object({
  name: z.string()
    .max(255, "Filename too long")
    .refine((name) => !/[<>:"/\\|?*]/.test(name), "Filename contains invalid characters")
    .refine((name) => {
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar', '.js', '.vbs'];
      return !dangerousExtensions.some(ext => name.toLowerCase().endsWith(ext));
    }, "File type not allowed"),
  size: z.number()
    .max(10 * 1024 * 1024, "File size cannot exceed 10MB")
    .min(1, "File cannot be empty"),
  type: z.string()
    .refine((type) => {
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      return allowedTypes.includes(type);
    }, "File type not supported")
});

// URL validation with additional security
export const SecureURLSchema = z.string()
  .url("Invalid URL format")
  .max(2048, "URL too long")
  .refine((url) => {
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
    return !dangerousProtocols.some(protocol => url.toLowerCase().startsWith(protocol));
  }, "URL uses unsafe protocol")
  .refine((url) => {
    // Block suspicious URL patterns
    const suspiciousPatterns = [
      /[<>"']/,
      /\s/,
      /[\x00-\x1f\x7f]/
    ];
    return !suspiciousPatterns.some(pattern => pattern.test(url));
  }, "URL contains invalid characters");

// Validation functions
export const validatePassword = (password: string) => {
  return PasswordStrengthSchema.safeParse(password);
};

export const validateEducationalEmail = (email: string) => {
  return EducationalEmailSchema.safeParse(email);
};

export const validateUserRole = (role: string) => {
  return UserRoleSchema.safeParse(role);
};

export const validateSecureContent = (content: string) => {
  return SecureContentSchema.safeParse(content);
};

export const validateSecureFile = (file: { name: string; size: number; type: string }) => {
  return SecureFileSchema.safeParse(file);
};

export const validateSecureURL = (url: string) => {
  return SecureURLSchema.safeParse(url);
};

// Security utility functions
export const sanitizeForLog = (input: string): string => {
  // Remove potentially sensitive information for logging
  return input
    .replace(/password[=:]\s*\S+/gi, 'password=***')
    .replace(/token[=:]\s*\S+/gi, 'token=***')
    .replace(/key[=:]\s*\S+/gi, 'key=***')
    .replace(/secret[=:]\s*\S+/gi, 'secret=***');
};

export const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};
