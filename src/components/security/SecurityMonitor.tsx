
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { securityService } from '@/services/securityService';
import { useToast } from '@/hooks/use-toast';

export const SecurityMonitor: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Monitor for suspicious activity patterns
    const monitorActivity = () => {
      const activityData = {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
      };

      // Check for unusual patterns
      const previousActivity = localStorage.getItem('lastActivity');
      if (previousActivity) {
        const lastData = JSON.parse(previousActivity);
        
        // Check for rapid location changes (could indicate account compromise)
        if (lastData.timezone !== activityData.timezone) {
          securityService.logSecurityEvent('location_change_detected', {
            previous_timezone: lastData.timezone,
            current_timezone: activityData.timezone,
            time_diff: activityData.timestamp - lastData.timestamp
          }, 'medium');
        }

        // Check for unusual time gaps (could indicate session hijacking)
        const timeDiff = activityData.timestamp - lastData.timestamp;
        if (timeDiff > 24 * 60 * 60 * 1000) { // 24 hours
          securityService.logSecurityEvent('long_session_gap', {
            gap_hours: timeDiff / (60 * 60 * 1000),
            last_activity: lastData.timestamp
          }, 'low');
        }
      }

      localStorage.setItem('lastActivity', JSON.stringify(activityData));
    };

    // Monitor on page load and focus
    monitorActivity();
    window.addEventListener('focus', monitorActivity);
    
    // Monitor for tab visibility changes (security awareness)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        securityService.logSecurityEvent('tab_hidden', { timestamp: Date.now() });
      } else {
        securityService.logSecurityEvent('tab_visible', { timestamp: Date.now() });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', monitorActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  return null; // This is a monitoring component with no UI
};
