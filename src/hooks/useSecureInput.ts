
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { sanitizeText, sanitizeHTML, checkRateLimit } from '@/utils/contentSanitization';
import { 
  validatePostContent, 
  validateCommentContent, 
  validateMessageContent,
  validateProfileUpdate
} from '@/utils/inputValidation';

interface UseSecureInputOptions {
  type: 'post' | 'comment' | 'message' | 'profile';
  userId?: string;
  maxLength?: number;
  allowHTML?: boolean;
  rateLimitKey?: string;
}

export const useSecureInput = (options: UseSecureInputOptions) => {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);

  const validateAndSanitize = useCallback(async (input: any) => {
    setIsValidating(true);
    
    try {
      // Rate limiting check
      if (options.rateLimitKey) {
        const rateLimitPassed = checkRateLimit(options.rateLimitKey, 10, 60000); // 10 requests per minute
        if (!rateLimitPassed) {
          throw new Error('Rate limit exceeded. Please slow down.');
        }
      }

      // Validate input based on type
      let validationResult;
      switch (options.type) {
        case 'post':
          validationResult = validatePostContent(input);
          break;
        case 'comment':
          validationResult = validateCommentContent(input);
          break;
        case 'message':
          validationResult = validateMessageContent(input);
          break;
        case 'profile':
          validationResult = validateProfileUpdate(input);
          break;
        default:
          throw new Error('Invalid input type');
      }

      if (!validationResult.success) {
        const errorMessage = validationResult.error.issues[0]?.message || 'Validation failed';
        throw new Error(errorMessage);
      }

      // Sanitize content
      const sanitizedData = { ...validationResult.data };
      
      if (sanitizedData.content) {
        if (options.allowHTML) {
          sanitizedData.content = sanitizeHTML(sanitizedData.content);
        } else {
          sanitizedData.content = sanitizeText(sanitizedData.content);
        }
      }

      if (sanitizedData.display_name) {
        sanitizedData.display_name = sanitizeText(sanitizedData.display_name);
      }

      if (sanitizedData.bio) {
        sanitizedData.bio = sanitizeText(sanitizedData.bio);
      }

      return { success: true, data: sanitizedData };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      
      toast({
        title: 'Input validation failed',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return { success: false, error: errorMessage };
      
    } finally {
      setIsValidating(false);
    }
  }, [options, toast]);

  return {
    validateAndSanitize,
    isValidating
  };
};
