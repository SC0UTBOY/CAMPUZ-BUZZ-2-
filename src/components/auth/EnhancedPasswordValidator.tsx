
import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';
import { LeakedPasswordService } from '@/services/leakedPasswordService';
import { useAuthSecurity } from '@/hooks/useAuthSecurity';

interface EnhancedPasswordValidatorProps {
  password: string;
  onValidationChange?: (isValid: boolean, score: number) => void;
}

export const EnhancedPasswordValidator: React.FC<EnhancedPasswordValidatorProps> = ({
  password,
  onValidationChange
}) => {
  const { checkPasswordStrength } = useAuthSecurity();
  const [isCompromised, setIsCompromised] = useState(false);
  const [isCheckingCompromised, setIsCheckingCompromised] = useState(false);
  const [strengthResult, setStrengthResult] = useState<{
    isStrong: boolean;
    score: number;
    suggestions: string[];
  }>({ isStrong: false, score: 0, suggestions: [] });

  useEffect(() => {
    if (password) {
      // Check password strength
      const result = checkPasswordStrength(password);
      setStrengthResult(result);

      // Check if password is compromised (with debounce)
      const timeoutId = setTimeout(async () => {
        if (password.length >= 8) {
          setIsCheckingCompromised(true);
          try {
            const compromised = await LeakedPasswordService.isPasswordCompromised(password);
            setIsCompromised(compromised);
          } catch (error) {
            console.error('Error checking password compromise:', error);
          }
          setIsCheckingCompromised(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setStrengthResult({ isStrong: false, score: 0, suggestions: [] });
      setIsCompromised(false);
    }
  }, [password, checkPasswordStrength]);

  useEffect(() => {
    const isValid = strengthResult.isStrong && !isCompromised;
    onValidationChange?.(isValid, strengthResult.score);
  }, [strengthResult, isCompromised, onValidationChange]);

  const getStrengthColor = (score: number): string => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    if (score >= 2) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStrengthLabel = (score: number): string => {
    if (score >= 5) return 'Very Strong';
    if (score >= 4) return 'Strong';
    if (score >= 3) return 'Good';
    if (score >= 2) return 'Weak';
    return 'Very Weak';
  };

  if (!password) return null;

  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Password Strength</span>
          <Badge 
            variant={strengthResult.score >= 4 ? 'default' : 'destructive'}
            className={getStrengthColor(strengthResult.score)}
          >
            {getStrengthLabel(strengthResult.score)}
          </Badge>
        </div>
        <Progress 
          value={(strengthResult.score / 6) * 100} 
          className="h-2"
        />
      </div>

      {/* Security Checks */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          {password.length >= 8 ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-red-600" />
          )}
          <span>At least 8 characters</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          {/[a-z]/.test(password) ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-red-600" />
          )}
          <span>Lowercase letter</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          {/[A-Z]/.test(password) ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-red-600" />
          )}
          <span>Uppercase letter</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          {/[0-9]/.test(password) ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-red-600" />
          )}
          <span>Number</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          {/[^A-Za-z0-9]/.test(password) ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-red-600" />
          )}
          <span>Special character</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {isCheckingCompromised ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          ) : isCompromised ? (
            <X className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <span>
            {isCheckingCompromised ? 'Checking...' : 
             isCompromised ? 'Password found in data breaches' : 
             'Not found in known breaches'}
          </span>
        </div>
      </div>

      {/* Compromised Password Alert */}
      {isCompromised && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This password has been found in data breaches and should not be used. 
            Please choose a different password.
          </AlertDescription>
        </Alert>
      )}

      {/* Suggestions */}
      {strengthResult.suggestions.length > 0 && (
        <Alert>
          <AlertDescription>
            <div className="space-y-1">
              <strong>Suggestions:</strong>
              <ul className="list-disc list-inside text-sm">
                {strengthResult.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
