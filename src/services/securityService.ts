
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SecurityAlert {
  id: string;
  type: 'suspicious_activity' | 'failed_login' | 'account_lockout' | 'permission_escalation' | 'data_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SecurityPolicy {
  max_failed_attempts: number;
  lockout_duration_minutes: number;
  session_timeout_minutes: number;
  require_2fa_for_admins: boolean;
  password_min_length: number;
  password_require_special_chars: boolean;
}

class SecurityService {
  private toast?: ReturnType<typeof useToast>['toast'];

  constructor(toast?: ReturnType<typeof useToast>['toast']) {
    this.toast = toast;
  }

  // Log security events with enhanced metadata
  async logSecurityEvent(
    eventType: string, 
    metadata: Record<string, any> = {},
    severity: 'low' | 'medium' | 'high' = 'low'
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('security_events').insert({
        user_id: user.id,
        event_type: eventType,
        metadata: {
          ...metadata,
          severity,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          url: window.location.href
        },
        user_agent: navigator.userAgent
      });

      // Show alert for high severity events
      if (severity === 'high' && this.toast) {
        this.toast({
          title: 'Security Alert',
          description: `Security event detected: ${eventType}`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Check if user has specific role
  async hasRole(requiredRole: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!profile) return false;

      // Role hierarchy: admin > moderator > student
      const roleHierarchy = {
        'admin': 3,
        'moderator': 2,
        'student': 1
      };

      const userRoleLevel = roleHierarchy[profile.role as keyof typeof roleHierarchy] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

      return userRoleLevel >= requiredRoleLevel;
    } catch (error) {
      console.error('Error checking user role:', error);
      return false;
    }
  }

  // Enhanced permission checking for specific actions
  async canPerformAction(action: string, resourceId?: string, resourceType?: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check basic role permissions
      switch (action) {
        case 'moderate_content':
          return await this.hasRole('moderator');
        
        case 'manage_users':
          return await this.hasRole('admin');
        
        case 'delete_any_post':
          return await this.hasRole('moderator');
        
        case 'ban_user':
          return await this.hasRole('admin');
        
        case 'create_community':
          return await this.hasRole('student'); // All authenticated users can create communities
        
        case 'manage_community':
          if (!resourceId) return false;
          return await this.canManageCommunity(resourceId);
        
        case 'moderate_community':
          if (!resourceId) return false;
          return await this.canModerateCommunity(resourceId);
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking action permission:', error);
      return false;
    }
  }

  // Check community management permissions
  private async canManageCommunity(communityId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if user is admin
      if (await this.hasRole('admin')) return true;

      // Check if user is community creator
      const { data: community } = await supabase
        .from('communities')
        .select('created_by')
        .eq('id', communityId)
        .single();

      return community?.created_by === user.id;
    } catch (error) {
      console.error('Error checking community management permission:', error);
      return false;
    }
  }

  // Check community moderation permissions
  private async canModerateCommunity(communityId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Use the database function
      const { data, error } = await supabase.rpc('can_moderate_community', {
        community_uuid: communityId,
        user_uuid: user.id
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking community moderation permission:', error);
      return false;
    }
  }

  // Monitor user activity for suspicious behavior
  async monitorUserActivity(activityType: string, metadata: Record<string, any> = {}): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Track activity patterns
      const activityData = {
        user_id: user.id,
        activity_type: activityType,
        timestamp: new Date().toISOString(),
        ...metadata
      };

      // Check for suspicious patterns
      const suspiciousPatterns = await this.detectSuspiciousActivity(activityData);
      
      if (suspiciousPatterns.length > 0) {
        await this.logSecurityEvent('suspicious_activity_detected', {
          patterns: suspiciousPatterns,
          activity: activityData
        }, 'high');
      }

    } catch (error) {
      console.error('Error monitoring user activity:', error);
    }
  }

  // Detect suspicious activity patterns
  private async detectSuspiciousActivity(activityData: any): Promise<string[]> {
    const patterns: string[] = [];

    try {
      // Check for rapid repeated actions
      const recentEvents = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', activityData.user_id)
        .eq('event_type', activityData.activity_type)
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .limit(10);

      if (recentEvents.data && recentEvents.data.length > 5) {
        patterns.push('rapid_repeated_actions');
      }

      // Check for unusual time patterns (activity outside normal hours)
      const hour = new Date().getHours();
      if (hour < 6 || hour > 23) {
        patterns.push('unusual_time_activity');
      }

    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
    }

    return patterns;
  }

  // Get user's security settings
  async getUserSecuritySettings(): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_security_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching security settings:', error);
      return null;
    }
  }

  // Update user's security settings
  async updateSecuritySettings(updates: Record<string, any>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('user_security_settings')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      await this.logSecurityEvent('security_settings_updated', {
        changes: Object.keys(updates)
      });

      return true;
    } catch (error) {
      console.error('Error updating security settings:', error);
      return false;
    }
  }

  // Validate content for security threats
  validateContent(content: string): { isValid: boolean; threats: string[] } {
    const threats: string[] = [];

    // Check for potential XSS
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    xssPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        threats.push('Potential XSS detected');
      }
    });

    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/gi,
      /(UNION\s+SELECT)/gi,
      /('|(\\')|(;)|(\\;))/gi
    ];

    sqlPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        threats.push('Potential SQL injection detected');
      }
    });

    return {
      isValid: threats.length === 0,
      threats
    };
  }
}

export const securityService = new SecurityService();

export const useSecurityService = () => {
  const { toast } = useToast();
  return new SecurityService(toast);
};
