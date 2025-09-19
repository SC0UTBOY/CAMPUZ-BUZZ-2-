
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { securityService } from '@/services/securityService';

interface SecurityEvent {
  id: string;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface SecuritySettings {
  password_changed_at: string;
  failed_login_attempts: number;
  account_locked_until: string | null;
  two_factor_enabled: boolean;
  security_questions_set: boolean;
}

export const useSecurityMonitoring = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSecurityData();
      setupRealtimeSubscription();
    }
  }, [user]);

  const loadSecurityData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load recent security events
      const { data: eventsData, error: eventsError } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (eventsError) throw eventsError;
      
      const transformedEvents: SecurityEvent[] = (eventsData || []).map(event => ({
        id: event.id,
        event_type: event.event_type,
        ip_address: event.ip_address as string | null,
        user_agent: event.user_agent as string | null,
        metadata: event.metadata as Record<string, any>,
        created_at: event.created_at
      }));
      
      setSecurityEvents(transformedEvents);

      // Load security settings
      const { data: settings, error: settingsError } = await supabase
        .from('user_security_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      setSecuritySettings(settings);

      // Check for security alerts
      if (settings?.failed_login_attempts && settings.failed_login_attempts > 3) {
        toast({
          title: "Security Alert",
          description: `${settings.failed_login_attempts} failed login attempts detected on your account.`,
          variant: "destructive"
        });
      }

      // Check for account lockout
      if (settings?.account_locked_until && new Date(settings.account_locked_until) > new Date()) {
        toast({
          title: "Account Locked",
          description: "Your account has been temporarily locked due to suspicious activity.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('security_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_events',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newEvent = payload.new as SecurityEvent;
          setSecurityEvents(prev => [newEvent, ...prev.slice(0, 19)]);
          
          // Show toast for high-severity events
          const metadata = newEvent.metadata as any;
          if (metadata?.severity === 'high') {
            toast({
              title: "Security Alert",
              description: `New security event: ${newEvent.event_type.replace(/_/g, ' ')}`,
              variant: "destructive"
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const logSecurityEvent = async (eventType: string, metadata: Record<string, any> = {}) => {
    try {
      await securityService.logSecurityEvent(eventType, metadata);
      loadSecurityData(); // Refresh data
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const updateSecuritySettings = async (updates: Partial<SecuritySettings>) => {
    if (!user) return;

    try {
      const success = await securityService.updateSecuritySettings(updates);
      
      if (success) {
        loadSecurityData();
        toast({
          title: "Security settings updated",
          description: "Your security preferences have been saved."
        });
      } else {
        throw new Error('Failed to update security settings');
      }
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast({
        title: "Error updating settings",
        description: "Failed to update security settings.",
        variant: "destructive"
      });
    }
  };

  const enableTwoFactor = async () => {
    await updateSecuritySettings({ two_factor_enabled: true });
    await logSecurityEvent('two_factor_enabled');
  };

  const disableTwoFactor = async () => {
    await updateSecuritySettings({ two_factor_enabled: false });
    await logSecurityEvent('two_factor_disabled');
  };

  const reportSuspiciousActivity = async (description: string) => {
    await logSecurityEvent('user_reported_suspicious_activity', {
      description,
      reported_at: new Date().toISOString()
    });
  };

  return {
    securityEvents,
    securitySettings,
    loading,
    logSecurityEvent,
    updateSecuritySettings,
    enableTwoFactor,
    disableTwoFactor,
    reportSuspiciousActivity,
    refreshSecurityData: loadSecurityData
  };
};
