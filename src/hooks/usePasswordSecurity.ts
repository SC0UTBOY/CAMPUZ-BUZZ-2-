
import { useState, useEffect } from 'react';
import { validateEnhancedPassword } from '@/utils/enhancedSecurityValidation';
import { useToast } from '@/hooks/use-toast';

interface PasswordSecurityOptions {
  checkLeaks?: boolean;
  minStrength?: number;
}

interface PasswordStrengthResult {
  score: number;
  isSecure: boolean;
  feedback: string[];
  hasLeaks?: boolean;
}

export const usePasswordSecurity = (options: PasswordSecurityOptions = {}) => {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  
  const { checkLeaks = true, minStrength = 80 } = options;

  const checkPasswordStrength = async (password: string): Promise<PasswordStrengthResult> => {
    setIsChecking(true);
    
    try {
      // Validate password strength
      const strengthResult = validateEnhancedPassword(password);
      
      const feedback: string[] = [];
      let score = 0;
      
      // Calculate score based on criteria
      if (password.length >= 12) score += 25;
      else feedback.push('Use at least 12 characters');
      
      if (/[a-z]/.test(password)) score += 15;
      else feedback.push('Include lowercase letters');
      
      if (/[A-Z]/.test(password)) score += 15;
      else feedback.push('Include uppercase letters');
      
      if (/[0-9]/.test(password)) score += 15;
      else feedback.push('Include numbers');
      
      if (/[^A-Za-z0-9]/.test(password)) score += 15;
      else feedback.push('Include special characters');
      
      if (!/(.)\1{2,}/g.test(password)) score += 10;
      else feedback.push('Avoid repeated characters');
      
      if (password.length >= 16) score += 5;
      
      // Check for common patterns
      const commonPasswords = [
        'password123', '123456789', 'qwerty123', 'password1',
        'letmein123', 'welcome123', 'admin123', 'user123'
      ];
      
      const hasCommonPattern = commonPasswords.some(common => 
        password.toLowerCase().includes(common.toLowerCase())
      );
      
      if (hasCommonPattern) {
        score = Math.max(0, score - 30);
        feedback.push('Avoid common password patterns');
      }

      // Check against breached passwords if enabled
      let hasLeaks = false;
      if (checkLeaks) {
        hasLeaks = await checkPasswordBreach(password);
        if (hasLeaks) {
          score = Math.max(0, score - 40);
          feedback.push('This password has been found in data breaches');
        }
      }

      const result = {
        score: Math.min(100, score),
        isSecure: score >= minStrength && strengthResult.success,
        feedback,
        hasLeaks
      };

      return result;
      
    } catch (error) {
      console.error('Password security check failed:', error);
      return {
        score: 0,
        isSecure: false,
        feedback: ['Password security check failed'],
        hasLeaks: false
      };
    } finally {
      setIsChecking(false);
    }
  };

  const validatePasswordSecurity = async (password: string) => {
    setIsChecking(true);
    
    try {
      const strengthResult = await checkPasswordStrength(password);
      
      if (!strengthResult.isSecure) {
        toast({
          title: "Weak Password",
          description: strengthResult.feedback[0] || "Password doesn't meet security requirements",
          variant: "destructive"
        });
        return { isValid: false, issues: strengthResult.feedback.map(f => ({ message: f })) };
      }

      if (strengthResult.hasLeaks) {
        toast({
          title: "Compromised Password",
          description: "This password has been found in data breaches. Please choose a different password.",
          variant: "destructive"
        });
        return { isValid: false, issues: [{ message: "Password found in breach database" }] };
      }

      return { isValid: true, issues: [] };
      
    } catch (error) {
      console.error('Password security check failed:', error);
      return { isValid: false, issues: [{ message: "Security check failed" }] };
    } finally {
      setIsChecking(false);
    }
  };

  const checkPasswordBreach = async (password: string): Promise<boolean> => {
    // Mock implementation - in production, use HaveIBeenPwned API or similar
    // For security, we'd hash the password and check only the first 5 characters
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890', 'password1'
    ];
    
    return commonPasswords.some(common => 
      password.toLowerCase().includes(common.toLowerCase())
    );
  };

  const generateSecurePassword = (length: number = 16): string => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  };

  return {
    checkPasswordStrength,
    validatePasswordSecurity,
    generateSecurePassword,
    isChecking
  };
};
