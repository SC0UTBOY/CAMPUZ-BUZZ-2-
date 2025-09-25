
import React, { useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useSecureInput } from '@/hooks/useSecureInput';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface SecureInputProps {
  type: 'post' | 'comment' | 'message' | 'profile';
  inputType?: 'text' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  onValidatedSubmit?: (sanitizedData: any) => void;
  placeholder?: string;
  maxLength?: number;
  allowHTML?: boolean;
  className?: string;
  disabled?: boolean;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  type,
  inputType = 'textarea',
  value,
  onChange,
  onValidatedSubmit,
  placeholder,
  maxLength,
  allowHTML = false,
  className,
  disabled = false
}) => {
  const { user } = useAuth();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);

  const { validateAndSanitize, isValidating } = useSecureInput({
    type,
    userId: user?.id,
    allowHTML,
    rateLimitKey: `${type}_${user?.id}`
  });

  const handleSubmit = useCallback(async () => {
    if (!onValidatedSubmit) return;

    setValidationError(null);
    
    const result = await validateAndSanitize({ content: value });
    
    if (result.success) {
      onValidatedSubmit(result.data);
    } else {
      setValidationError(result.error || 'Validation failed');
    }
  }, [value, validateAndSanitize, onValidatedSubmit]);

  const handleInputChange = (newValue: string) => {
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
    onChange(newValue);
  };

  const InputComponent = inputType === 'textarea' ? Textarea : Input;

  return (
    <div className="space-y-2">
      <div className="relative">
        <InputComponent
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled || isValidating}
          className={`${className} ${validationError ? 'border-red-500' : ''}`}
        />
        
        <div className="absolute top-2 right-2 flex items-center space-x-1">
          {isValidating && (
            <Shield className="h-4 w-4 text-blue-500 animate-pulse" />
          )}
          
          <button
            type="button"
            onClick={() => setShowSecurityInfo(!showSecurityInfo)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Shield className="h-4 w-4" />
          </button>
        </div>
      </div>

      {maxLength && (
        <div className="text-sm text-gray-500 text-right">
          {value.length}/{maxLength}
        </div>
      )}

      {validationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {showSecurityInfo && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your input is automatically validated and sanitized to prevent security issues. 
            Script tags, malicious URLs, and harmful content are filtered out.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
