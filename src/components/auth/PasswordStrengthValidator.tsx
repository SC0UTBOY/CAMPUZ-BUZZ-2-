
import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { validatePassword } from '@/utils/securityValidation';

interface PasswordStrengthValidatorProps {
  password: string;
  onStrengthChange: (isStrong: boolean, score: number) => void;
}

export const PasswordStrengthValidator: React.FC<PasswordStrengthValidatorProps> = ({
  password,
  onStrengthChange
}) => {
  const [strength, setStrength] = useState({
    isStrong: false,
    score: 0,
    suggestions: [] as string[]
  });

  useEffect(() => {
    if (!password) {
      setStrength({ isStrong: false, score: 0, suggestions: [] });
      onStrengthChange(false, 0);
      return;
    }

    const result = validatePassword(password);
    
    if (result.success) {
      const newStrength = { isStrong: true, score: 100, suggestions: [] };
      setStrength(newStrength);
      onStrengthChange(true, 100);
    } else {
      // Calculate score based on criteria met
      let score = 0;
      const suggestions: string[] = [];
      
      if (password.length >= 8) score += 20;
      else suggestions.push('Use at least 8 characters');
      
      if (/[a-z]/.test(password)) score += 15;
      else suggestions.push('Include lowercase letters');
      
      if (/[A-Z]/.test(password)) score += 15;
      else suggestions.push('Include uppercase letters');
      
      if (/[0-9]/.test(password)) score += 15;
      else suggestions.push('Include numbers');
      
      if (/[^A-Za-z0-9]/.test(password)) score += 15;
      else suggestions.push('Include special characters');
      
      if (password.length >= 12) score += 10;
      
      if (!/(.)\1{2,}/g.test(password)) score += 10;
      else suggestions.push('Avoid repeated characters');

      const newStrength = {
        isStrong: score >= 80,
        score,
        suggestions
      };
      
      setStrength(newStrength);
      onStrengthChange(newStrength.isStrong, score);
    }
  }, [password, onStrengthChange]);

  const getStrengthColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStrengthLabel = (score: number) => {
    if (score >= 80) return { label: 'Strong', variant: 'default' as const };
    if (score >= 60) return { label: 'Good', variant: 'secondary' as const };
    if (score >= 40) return { label: 'Fair', variant: 'secondary' as const };
    return { label: 'Weak', variant: 'destructive' as const };
  };

  if (!password) return null;

  const strengthLabel = getStrengthLabel(strength.score);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Password Strength</span>
        <Badge variant={strengthLabel.variant}>
          {strengthLabel.label}
        </Badge>
      </div>
      
      <Progress 
        value={strength.score} 
        className={`h-2 ${getStrengthColor(strength.score)}`}
      />
      
      {strength.suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Suggestions:</p>
          <ul className="space-y-1">
            {strength.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-center space-x-2 text-sm text-muted-foreground">
                <XCircle className="h-3 w-3 text-red-500" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {strength.isStrong && (
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>Password meets security requirements</span>
        </div>
      )}
    </div>
  );
};
