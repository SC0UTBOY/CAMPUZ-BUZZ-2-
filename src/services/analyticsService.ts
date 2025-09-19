
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsEvent {
  event_type: string;
  user_id?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

interface EngagementMetrics {
  total_posts: number;
  total_comments: number;
  total_likes: number;
  active_users: number;
  avg_session_duration: number;
}

class AnalyticsService {
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private readonly MAX_QUEUE_SIZE = 50;

  // Track user events
  async trackEvent(eventType: string, metadata: Record<string, any> = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const event: AnalyticsEvent = {
        event_type: eventType,
        user_id: user?.id,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          page_url: window.location.href
        },
        timestamp: new Date().toISOString()
      };

      this.eventQueue.push(event);

      // Auto-flush if queue is full
      if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
        await this.flushEvents();
      } else if (!this.flushTimeout) {
        this.scheduleFlush();
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  // Common event tracking methods
  async trackPageView(page: string) {
    await this.trackEvent('page_view', { page });
  }

  async trackPostCreated(postId: string) {
    await this.trackEvent('post_created', { post_id: postId });
  }

  async trackPostLiked(postId: string) {
    await this.trackEvent('post_liked', { post_id: postId });
  }

  async trackCommentCreated(postId: string, commentId: string) {
    await this.trackEvent('comment_created', { post_id: postId, comment_id: commentId });
  }

  async trackUserLogin() {
    await this.trackEvent('user_login');
  }

  async trackUserSignup() {
    await this.trackEvent('user_signup');
  }

  async trackFeatureUsed(feature: string, metadata: Record<string, any> = {}) {
    await this.trackEvent('feature_used', { feature, ...metadata });
  }

  // Flush events to database
  private async flushEvents() {
    if (this.eventQueue.length === 0) return;

    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];

      // Clear timeout
      if (this.flushTimeout) {
        clearTimeout(this.flushTimeout);
        this.flushTimeout = null;
      }

      // Insert events into analytics table
      const { error } = await supabase
        .from('analytics_events')
        .insert(events);

      if (error) {
        console.error('Failed to flush analytics events:', error);
        // Put events back in queue if failed
        this.eventQueue.unshift(...events);
      }
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
    }
  }

  private scheduleFlush() {
    this.flushTimeout = setTimeout(() => {
      this.flushEvents();
    }, this.FLUSH_INTERVAL);
  }

  // Get engagement metrics (admin only)
  async getEngagementMetrics(timeRange: 'day' | 'week' | 'month' = 'week'): Promise<EngagementMetrics | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profile?.role !== 'admin') return null;

      const timeCondition = this.getTimeCondition(timeRange);

      // Get metrics
      const [postsResult, commentsResult, likesResult, analyticsResult] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact' }).gte('created_at', timeCondition),
        supabase.from('comments').select('id', { count: 'exact' }).gte('created_at', timeCondition),
        supabase.from('likes').select('id', { count: 'exact' }).gte('created_at', timeCondition),
        supabase.from('analytics_events')
          .select('user_id')
          .eq('event_type', 'page_view')
          .gte('timestamp', timeCondition)
      ]);

      const activeUsers = new Set(analyticsResult.data?.map(event => event.user_id)).size;

      return {
        total_posts: postsResult.count || 0,
        total_comments: commentsResult.count || 0,
        total_likes: likesResult.count || 0,
        active_users: activeUsers,
        avg_session_duration: 0 // Would need session tracking
      };
    } catch (error) {
      console.error('Failed to get engagement metrics:', error);
      return null;
    }
  }

  private getTimeCondition(range: 'day' | 'week' | 'month'): string {
    const now = new Date();
    switch (range) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  // Cleanup on page unload
  beforeUnload() {
    if (this.eventQueue.length > 0) {
      this.flushEvents();
    }
  }
}

export const analyticsService = new AnalyticsService();

// Auto-flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    analyticsService.beforeUnload();
  });
}
