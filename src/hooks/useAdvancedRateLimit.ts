
import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AdvancedRateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
  progressiveDelay?: boolean;
  identifier?: string;
}

interface RateLimitState {
  attempts: number;
  isBlocked: boolean;
  nextAttemptAt?: Date;
  remainingAttempts: number;
}

export const useAdvancedRateLimit = (config: AdvancedRateLimitConfig) => {
  const { toast } = useToast();
  const attemptsRef = useRef<{ timestamp: number; delay: number }[]>([]);
  const [state, setState] = useState<RateLimitState>({
    attempts: 0,
    isBlocked: false,
    remainingAttempts: config.maxAttempts
  });
  const blockTimeoutRef = useRef<NodeJS.Timeout>();

  const calculateDelay = useCallback((attemptCount: number): number => {
    if (!config.progressiveDelay) return 0;
    
    // Progressive delay: 1s, 2s, 4s, 8s, etc.
    return Math.min(Math.pow(2, attemptCount - 1) * 1000, 30000);
  }, [config.progressiveDelay]);

  const checkRateLimit = useCallback((): { allowed: boolean; retryAfter?: number } => {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean old attempts
    attemptsRef.current = attemptsRef.current.filter(
      attempt => attempt.timestamp > windowStart
    );

    const currentAttempts = attemptsRef.current.length;
    
    if (currentAttempts >= config.maxAttempts) {
      const lastAttempt = attemptsRef.current[attemptsRef.current.length - 1];
      const retryAfter = config.blockDurationMs || config.windowMs;
      const nextAttemptAt = new Date(lastAttempt.timestamp + retryAfter);

      if (now < nextAttemptAt.getTime()) {
        setState(prev => ({
          ...prev,
          isBlocked: true,
          nextAttemptAt,
          remainingAttempts: 0
        }));

        toast({
          title: "Rate limit exceeded",
          description: `Too many attempts. Try again in ${Math.ceil((nextAttemptAt.getTime() - now) / 1000)} seconds.`,
          variant: "destructive"
        });

        return { allowed: false, retryAfter: Math.ceil((nextAttemptAt.getTime() - now) / 1000) };
      }
    }

    // Record attempt with progressive delay
    const delay = calculateDelay(currentAttempts + 1);
    attemptsRef.current.push({ timestamp: now, delay });

    setState(prev => ({
      ...prev,
      attempts: currentAttempts + 1,
      isBlocked: false,
      remainingAttempts: Math.max(0, config.maxAttempts - currentAttempts - 1)
    }));

    return { allowed: true };
  }, [config, toast, calculateDelay]);

  const reset = useCallback(() => {
    attemptsRef.current = [];
    setState({
      attempts: 0,
      isBlocked: false,
      remainingAttempts: config.maxAttempts
    });
    
    if (blockTimeoutRef.current) {
      clearTimeout(blockTimeoutRef.current);
    }
  }, [config.maxAttempts]);

  return {
    checkRateLimit,
    reset,
    state
  };
};
