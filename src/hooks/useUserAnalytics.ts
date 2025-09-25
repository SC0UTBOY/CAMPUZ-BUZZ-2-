
import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { UserAnalyticsService } from '@/services/userAnalyticsService';
import { useAuth } from '@/contexts/AuthContext';

export const useUserAnalytics = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Track page views automatically
  useEffect(() => {
    if (user) {
      UserAnalyticsService.trackPageView(location.pathname, {
        search: location.search,
        hash: location.hash
      });
    }
  }, [location, user]);

  const trackAction = useCallback((action: string, target: string, data?: Record<string, any>) => {
    if (user) {
      UserAnalyticsService.trackUserAction(action, target, data);
    }
  }, [user]);

  const trackEvent = useCallback((eventType: string, data?: Record<string, any>) => {
    if (user) {
      UserAnalyticsService.trackEvent(eventType, data);
    }
  }, [user]);

  const trackError = useCallback((error: Error, context: string) => {
    UserAnalyticsService.trackError(error, context);
  }, []);

  return {
    trackAction,
    trackEvent,
    trackError
  };
};
