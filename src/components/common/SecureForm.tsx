
import React, { useState } from 'react';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { validatePostContent, validateCommentContent, validateProfileUpdate } from '@/utils/inputValidation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface SecureFormProps {
  children: React.ReactNode;
  onSubmit: (data: any) => Promise<void> | void;
  validationType?: 'post' | 'comment' | 'profile' | 'custom';
  customValidator?: (data: any) => { success: boolean; error?: { message: string } };
  className?: string;
}

export const SecureForm: React.FC<SecureFormProps> = ({
  children,
  onSubmit,
  validationType = 'custom',
  customValidator,
  className = ''
}) => {
  const { logSecurityEvent } = useSecurityMonitoring();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateInput = (data: any) => {
    switch (validationType) {
      case 'post':
        return validatePostContent(data);
      case 'comment':
        return validateCommentContent(data);
      case 'profile':
        return validateProfileUpdate(data);
      case 'custom':
        return customValidator ? customValidator(data) : { success: true };
      default:
        return { success: true };
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const data = Object.fromEntries(formData.entries());

      // Validate input
      const validation = validateInput(data);
      if (!validation.success) {
        const errorMessage = validation.error?.message || 'Validation failed';
        setValidationError(errorMessage);
        
        // Log validation failure
        await logSecurityEvent('input_validation_failed', {
          validationType,
          error: errorMessage,
          data: Object.keys(data) // Log field names but not values for privacy
        });
        
        return;
      }

      // Log successful validation
      await logSecurityEvent('form_submitted', {
        validationType,
        fieldCount: Object.keys(data).length
      });

      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
      setValidationError('An error occurred while submitting the form.');
      
      await logSecurityEvent('form_submission_error', {
        validationType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {validationError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
      
      <fieldset disabled={isSubmitting}>
        {children}
      </fieldset>
    </form>
  );
};
