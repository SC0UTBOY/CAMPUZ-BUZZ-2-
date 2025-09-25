
import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
}

export const useRateLimit = (config: RateLimitConfig) => {
  const { toast } = useToast();
  const attemptsRef = useRef<number[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const blockTimeoutRef = useRef<NodeJS.Timeout>();

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Remove attempts outside the current window
    attemptsRef.current = attemptsRef.current.filter(time => time > windowStart);

    // Check if we've exceeded the limit
    if (attemptsRef.current.length >= config.maxAttempts) {
      if (!isBlocked) {
        setIsBlocked(true);
        
        toast({
          title: "Rate limit exceeded",
          description: "Too many attempts. Please try again later.",
          variant: "destructive"
        });

        // Set block duration if specified
        if (config.blockDurationMs) {
          if (blockTimeoutRef.current) {
            clearTimeout(blockTimeoutRef.current);
          }
          
          blockTimeoutRef.current = setTimeout(() => {
            setIsBlocked(false);
            attemptsRef.current = [];
          }, config.blockDurationMs);
        }
      }
      return false;
    }

    // Record this attempt
    attemptsRef.current.push(now);
    return true;
  };

  const reset = () => {
    attemptsRef.current = [];
    setIsBlocked(false);
    if (blockTimeoutRef.current) {
      clearTimeout(blockTimeoutRef.current);
    }
  };

  return {
    checkRateLimit,
    isBlocked,
    reset,
    remainingAttempts: Math.max(0, config.maxAttempts - attemptsRef.current.length)
  };
};
