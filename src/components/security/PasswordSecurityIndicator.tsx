
import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, RefreshCw, Copy, Check } from 'lucide-react';
import { usePasswordSecurity } from '@/hooks/usePasswordSecurity';
import { useToast } from '@/hooks/use-toast';

interface PasswordSecurityIndicatorProps {
  password: string;
  onPasswordGenerated?: (password: string) => void;
  showGenerator?: boolean;
}

export const PasswordSecurityIndicator: React.FC<PasswordSecurityIndicatorProps> = ({
  password,
  onPasswordGenerated,
  showGenerator = false
}) => {
  const { toast } = useToast();
  const { checkPasswordStrength, generateSecurePassword, isChecking } = usePasswordSecurity({
    checkLeaks: true
  });
  
  const [strength, setStrength] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (password) {
      checkPasswordStrength(password).then(setStrength);
    } else {
      setStrength(null);
    }
  }, [password, checkPasswordStrength]);

  const getStrengthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStrengthText = (score: number) => {
    if (score >= 80) return 'Very Strong';
    if (score >= 60) return 'Strong';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Weak';
    return 'Very Weak';
  };

  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword(16);
    setGeneratedPassword(newPassword);
    onPasswordGenerated?.(newPassword);
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Password copied',
        description: 'The generated password has been copied to your clipboard.'
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy password to clipboard.',
        variant: 'destructive'
      });
    }
  };

  if (!password && !showGenerator) return null;

  return (
    <div className="space-y-4">
      {password && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Password Strength</span>
              {isChecking && <RefreshCw className="h-3 w-3 animate-spin" />}
            </div>
            {strength && (
              <Badge variant={strength.isSecure ? 'default' : 'destructive'}>
                {getStrengthText(strength.score)}
              </Badge>
            )}
          </div>

          {strength && (
            <>
              <Progress 
                value={strength.score} 
                className="h-2"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Score: {strength.score}/100</span>
                <span className={getStrengthColor(strength.score)}>
                  {getStrengthText(strength.score)}
                </span>
              </div>

              {strength.feedback.length > 0 && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Suggestions to improve your password:</p>
                      <ul className="text-sm space-y-1">
                        {strength.feedback.map((feedback, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-orange-500">•</span>
                            {feedback}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {strength.hasLeaks && (
                <Alert variant="destructive">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    This password has been found in known data breaches. Please use a different password.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>
      )}

      {showGenerator && (
        <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Password Generator</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGeneratePassword}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Generate
            </Button>
          </div>

          {generatedPassword && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={generatedPassword}
                    readOnly
                    className="w-full px-3 py-2 text-sm border rounded-md bg-background pr-16"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={handleCopyPassword}
                    >
                      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onPasswordGenerated?.(generatedPassword)}
              >
                Use This Password
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
