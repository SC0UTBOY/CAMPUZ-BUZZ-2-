
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsEvent {
  event_type: string;
  event_data?: Record<string, any>;
  session_id?: string;
}

export class UserAnalyticsService {
  private static sessionId = this.generateSessionId();

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Track user event
  static async trackEvent(eventType: string, eventData: Record<string, any> = {}): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('user_analytics')
        .insert({
          user_id: user?.id,
          event_type: eventType,
          event_data: eventData,
          session_id: this.sessionId,
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }

  // Track page view
  static async trackPageView(page: string, additionalData: Record<string, any> = {}): Promise<void> {
    await this.trackEvent('page_view', {
      page,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      ...additionalData
    });
  }

  // Track user action
  static async trackUserAction(action: string, target: string, additionalData: Record<string, any> = {}): Promise<void> {
    await this.trackEvent('user_action', {
      action,
      target,
      timestamp: new Date().toISOString(),
      ...additionalData
    });
  }

  // Track performance metrics
  static async trackPerformance(metrics: Record<string, number>): Promise<void> {
    await this.trackEvent('performance', {
      ...metrics,
      timestamp: new Date().toISOString()
    });
  }

  // Track error
  static async trackError(error: Error, context: string): Promise<void> {
    await this.trackEvent('error', {
      error_message: error.message,
      error_stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // Get user analytics (for the user's own data)
  static async getUserAnalytics(startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query.limit(1000);
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      return [];
    }
  }
}
