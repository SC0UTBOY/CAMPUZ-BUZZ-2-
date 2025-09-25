
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { securityService } from '@/services/securityService';

interface ErrorInfo {
  error: Error;
  errorInfo: React.ErrorInfo;
  timestamp: number;
  userId?: string;
  userAgent: string;
  url: string;
}

export const useAdvancedErrorBoundary = () => {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const { toast } = useToast();

  const logError = useCallback(async (error: Error, errorInfo?: React.ErrorInfo) => {
    const errorData: ErrorInfo = {
      error,
      errorInfo: errorInfo || { componentStack: '' },
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    setErrors(prev => [...prev.slice(-9), errorData]); // Keep last 10 errors

    // Log to security service for analysis
    await securityService.logSecurityEvent('client_error', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      severity: 'medium'
    });

    // Show user-friendly error message
    toast({
      title: 'Something went wrong',
      description: 'We\'ve logged this error and our team will investigate.',
      variant: 'destructive'
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error);
      console.error('Component stack:', errorInfo?.componentStack);
    }
  }, [toast]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const reportError = useCallback(async (errorId: number, description: string) => {
    const error = errors[errorId];
    if (error) {
      await securityService.logSecurityEvent('user_reported_error', {
        original_error: error.error.message,
        user_description: description,
        error_timestamp: error.timestamp
      });

      toast({
        title: 'Error reported',
        description: 'Thank you for helping us improve the application.'
      });
    }
  }, [errors, toast]);

  return {
    errors,
    logError,
    clearErrors,
    reportError
  };
};
