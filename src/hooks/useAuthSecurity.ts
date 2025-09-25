
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthSecurityState {
  isSecureSession: boolean;
  sessionExpiry: Date | null;
  lastActivity: Date;
  deviceInfo: string;
}

export const useAuthSecurity = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [securityState, setSecurityState] = useState<AuthSecurityState>({
    isSecureSession: false,
    sessionExpiry: null,
    lastActivity: new Date(),
    deviceInfo: ''
  });

  useEffect(() => {
    if (session) {
      const expiryTime = new Date(session.expires_at! * 1000);
      const now = new Date();
      const isSecure = expiryTime > now;

      setSecurityState({
        isSecureSession: isSecure,
        sessionExpiry: expiryTime,
        lastActivity: new Date(),
        deviceInfo: navigator.userAgent.substring(0, 100) // Truncated for privacy
      });

      // Check for session expiry
      const timeUntilExpiry = expiryTime.getTime() - now.getTime();
      if (timeUntilExpiry < 5 * 60 * 1000) { // 5 minutes warning
        toast({
          title: 'Session expiring soon',
          description: 'Your session will expire in less than 5 minutes. Please save your work.',
          variant: 'destructive'
        });
      }
    }
  }, [session, toast]);

  // Track user activity to update last activity timestamp
  useEffect(() => {
    const updateActivity = () => {
      setSecurityState(prev => ({ ...prev, lastActivity: new Date() }));
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  const forceLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: 'Logged out for security',
        description: 'You have been logged out due to security concerns.'
      });
    } catch (error) {
      console.error('Force logout error:', error);
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      toast({
        title: 'Session refreshed',
        description: 'Your session has been successfully renewed.'
      });
      
      return data.session;
    } catch (error) {
      console.error('Session refresh error:', error);
      toast({
        title: 'Session refresh failed',
        description: 'Please log in again.',
        variant: 'destructive'
      });
      return null;
    }
  };

  const checkPasswordStrength = (password: string): { 
    isStrong: boolean; 
    score: number; 
    suggestions: string[] 
  } => {
    const suggestions: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else suggestions.push('Use at least 8 characters');

    if (/[a-z]/.test(password)) score += 1;
    else suggestions.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else suggestions.push('Include uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else suggestions.push('Include numbers');

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else suggestions.push('Include special characters');

    if (password.length >= 12) score += 1;

    return {
      isStrong: score >= 4,
      score,
      suggestions
    };
  };

  return {
    securityState,
    forceLogout,
    refreshSession,
    checkPasswordStrength,
    isSecureEnvironment: window.location.protocol === 'https:' || window.location.hostname === 'localhost'
  };
};
