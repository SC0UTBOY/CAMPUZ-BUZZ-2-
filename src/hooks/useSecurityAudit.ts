
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SecurityAuditData {
  recentEvents: any[];
  suspiciousActivity: any[];
  failedLogins: number;
  accountStatus: 'active' | 'locked' | 'suspended';
  lastPasswordChange: string | null;
  twoFactorEnabled: boolean;
  recentSessions: any[];
}

export const useSecurityAudit = () => {
  const { user } = useAuth();
  const [auditData, setAuditData] = useState<SecurityAuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSecurityAuditData();
    }
  }, [user]);

  const loadSecurityAuditData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Load recent security events
      const { data: events, error: eventsError } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (eventsError) throw eventsError;

      // Load security settings
      const { data: settings, error: settingsError } = await supabase
        .from('user_security_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      // Analyze suspicious activity - properly handle metadata type
      const suspiciousActivity = events?.filter(event => {
        const metadata = event.metadata as any;
        return metadata?.severity === 'high' || 
               event.event_type === 'suspicious_activity_detected';
      }) || [];

      // Count failed logins in the last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const failedLogins = events?.filter(event => 
        event.event_type === 'failed_login' && 
        event.created_at > yesterday
      ).length || 0;

      // Determine account status
      let accountStatus: 'active' | 'locked' | 'suspended' = 'active';
      if (settings?.account_locked_until && new Date(settings.account_locked_until) > new Date()) {
        accountStatus = 'locked';
      }

      setAuditData({
        recentEvents: events || [],
        suspiciousActivity,
        failedLogins,
        accountStatus,
        lastPasswordChange: settings?.password_changed_at || null,
        twoFactorEnabled: settings?.two_factor_enabled || false,
        recentSessions: [] // Would need session tracking implementation
      });

    } catch (error: any) {
      console.error('Error loading security audit data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSecurityReport = () => {
    if (!auditData) return null;

    const report = {
      securityScore: calculateSecurityScore(auditData),
      recommendations: generateRecommendations(auditData),
      riskLevel: calculateRiskLevel(auditData),
      summary: generateSummary(auditData)
    };

    return report;
  };

  const calculateSecurityScore = (data: SecurityAuditData): number => {
    let score = 100;

    // Deduct points for security issues
    if (!data.twoFactorEnabled) score -= 20;
    if (data.failedLogins > 5) score -= 15;
    if (data.suspiciousActivity.length > 0) score -= 25;
    if (data.accountStatus !== 'active') score -= 30;
    
    // Check password age
    if (data.lastPasswordChange) {
      const passwordAge = Date.now() - new Date(data.lastPasswordChange).getTime();
      const passwordAgeMonths = passwordAge / (1000 * 60 * 60 * 24 * 30);
      if (passwordAgeMonths > 6) score -= 10;
    }

    return Math.max(0, score);
  };

  const calculateRiskLevel = (data: SecurityAuditData): 'low' | 'medium' | 'high' => {
    const score = calculateSecurityScore(data);
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    return 'high';
  };

  const generateRecommendations = (data: SecurityAuditData): string[] => {
    const recommendations: string[] = [];

    if (!data.twoFactorEnabled) {
      recommendations.push('Enable two-factor authentication for better security');
    }

    if (data.failedLogins > 5) {
      recommendations.push('Review failed login attempts and consider changing your password');
    }

    if (data.suspiciousActivity.length > 0) {
      recommendations.push('Review suspicious activity and secure your account');
    }

    if (data.lastPasswordChange) {
      const passwordAge = Date.now() - new Date(data.lastPasswordChange).getTime();
      const passwordAgeMonths = passwordAge / (1000 * 60 * 60 * 24 * 30);
      if (passwordAgeMonths > 6) {
        recommendations.push('Consider changing your password (last changed over 6 months ago)');
      }
    }

    return recommendations;
  };

  const generateSummary = (data: SecurityAuditData): string => {
    const riskLevel = calculateRiskLevel(data);
    const score = calculateSecurityScore(data);
    
    return `Your account security score is ${score}/100 with a ${riskLevel} risk level. ${
      data.suspiciousActivity.length > 0 
        ? `${data.suspiciousActivity.length} suspicious activities detected.` 
        : 'No recent suspicious activity detected.'
    }`;
  };

  return {
    auditData,
    loading,
    error,
    refreshAudit: loadSecurityAuditData,
    generateSecurityReport
  };
};
