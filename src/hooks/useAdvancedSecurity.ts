
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { securityService } from '@/services/securityService';
import { useToast } from '@/hooks/use-toast';

interface SecurityMetrics {
  failedLoginAttempts: number;
  lastPasswordChange: Date | null;
  twoFactorEnabled: boolean;
  accountLocked: boolean;
  suspiciousActivity: boolean;
  securityScore: number;
}

export const useAdvancedSecurity = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    failedLoginAttempts: 0,
    lastPasswordChange: null,
    twoFactorEnabled: false,
    accountLocked: false,
    suspiciousActivity: false,
    securityScore: 0
  });
  const [loading, setLoading] = useState(true);

  const loadSecurityMetrics = useCallback(async () => {
    if (!user) return;

    try {
      const settings = await securityService.getUserSecuritySettings();
      if (settings) {
        const score = calculateSecurityScore(settings);
        setMetrics({
          failedLoginAttempts: settings.failed_login_attempts || 0,
          lastPasswordChange: settings.password_changed_at ? new Date(settings.password_changed_at) : null,
          twoFactorEnabled: settings.two_factor_enabled || false,
          accountLocked: settings.account_locked_until ? new Date(settings.account_locked_until) > new Date() : false,
          suspiciousActivity: false, // Will be updated based on recent events
          securityScore: score
        });
      }
    } catch (error) {
      console.error('Failed to load security metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const calculateSecurityScore = (settings: any): number => {
    let score = 100;
    
    // Deduct points for security issues
    if (!settings.two_factor_enabled) score -= 25;
    if (settings.failed_login_attempts > 0) score -= (settings.failed_login_attempts * 5);
    if (settings.account_locked_until) score -= 30;
    
    // Check password age
    if (settings.password_changed_at) {
      const daysSinceChange = (Date.now() - new Date(settings.password_changed_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceChange > 90) score -= 15; // Deduct for old passwords
    }
    
    return Math.max(0, Math.min(100, score));
  };

  const enhanceSecurity = useCallback(async () => {
    if (!user) return;

    try {
      // Enable two-factor authentication
      await securityService.updateSecuritySettings({
        two_factor_enabled: true,
        login_notifications_enabled: true
      });

      toast({
        title: 'Security enhanced',
        description: 'Two-factor authentication has been enabled for your account.'
      });

      await loadSecurityMetrics();
    } catch (error) {
      toast({
        title: 'Security update failed',
        description: 'Failed to enhance security settings.',
        variant: 'destructive'
      });
    }
  }, [user, toast, loadSecurityMetrics]);

  const reportSuspiciousActivity = useCallback(async (description: string) => {
    await securityService.logSecurityEvent('user_reported_suspicious', {
      description,
      timestamp: new Date().toISOString(),
      user_report: true
    }, 'high');

    toast({
      title: 'Report submitted',
      description: 'Thank you for reporting suspicious activity. We\'ll investigate immediately.'
    });
  }, [toast]);

  const resetFailedAttempts = useCallback(async () => {
    if (!user) return;

    await securityService.updateSecuritySettings({
      failed_login_attempts: 0,
      account_locked_until: null
    });

    await loadSecurityMetrics();
  }, [user, loadSecurityMetrics]);

  useEffect(() => {
    loadSecurityMetrics();
  }, [loadSecurityMetrics]);

  return {
    metrics,
    loading,
    enhanceSecurity,
    reportSuspiciousActivity,
    resetFailedAttempts,
    refreshMetrics: loadSecurityMetrics
  };
};
