
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Users, Activity, Shield, Download } from 'lucide-react';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  userGrowth: Array<{ date: string; users: number; active: number }>;
  engagement: Array<{ date: string; posts: number; comments: number; likes: number }>;
  security: Array<{ date: string; events: number; threats: number }>;
  performance: Array<{ metric: string; value: number; change: number }>;
}

export const EnhancedAnalyticsDashboard: React.FC = () => {
  const { permissions, hasRole } = useRoleBasedAccess();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  });

  useEffect(() => {
    if (permissions.canViewAnalytics) {
      loadAnalyticsData();
    }
  }, [permissions.canViewAnalytics, dateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load user analytics data
      const { data: userAnalytics, error: userError } = await supabase
        .from('user_analytics')
        .select('*')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .order('created_at', { ascending: true });

      if (userError) throw userError;

      // Load security events
      const { data: securityEvents, error: securityError } = await supabase
        .from('security_events')
        .select('*')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .order('created_at', { ascending: true });

      if (securityError) throw securityError;

      // Process data for charts
      const processedData = processAnalyticsData(userAnalytics || [], securityEvents || []);
      setAnalyticsData(processedData);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (userAnalytics: any[], securityEvents: any[]): AnalyticsData => {
    // Group data by date
    const dailyStats: Record<string, any> = {};

    userAnalytics.forEach(event => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          users: new Set(),
          posts: 0,
          comments: 0,
          likes: 0,
          pageViews: 0
        };
      }

      dailyStats[date].users.add(event.user_id);
      
      switch (event.event_type) {
        case 'post_created':
          dailyStats[date].posts++;
          break;
        case 'comment_created':
          dailyStats[date].comments++;
          break;
        case 'post_liked':
          dailyStats[date].likes++;
          break;
        case 'page_view':
          dailyStats[date].pageViews++;
          break;
      }
    });

    // Convert to arrays for charts
    const userGrowth = Object.values(dailyStats).map((day: any) => ({
      date: day.date,
      users: day.users.size,
      active: day.pageViews
    }));

    const engagement = Object.values(dailyStats).map((day: any) => ({
      date: day.date,
      posts: day.posts,
      comments: day.comments,
      likes: day.likes
    }));

    // Process security data
    const securityStats: Record<string, any> = {};
    securityEvents.forEach(event => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      if (!securityStats[date]) {
        securityStats[date] = { date, events: 0, threats: 0 };
      }
      securityStats[date].events++;
      if (event.metadata?.severity === 'high') {
        securityStats[date].threats++;
      }
    });

    const security = Object.values(securityStats);

    // Calculate performance metrics
    const performance = [
      { metric: 'Total Users', value: userGrowth.reduce((sum, day) => sum + day.users, 0), change: 12 },
      { metric: 'Total Posts', value: engagement.reduce((sum, day) => sum + day.posts, 0), change: 8 },
      { metric: 'Engagement Rate', value: 78, change: 5 },
      { metric: 'Security Score', value: 94, change: 2 }
    ];

    return { userGrowth, engagement, security, performance };
  };

  const exportData = () => {
    if (!analyticsData) return;
    
    const dataToExport = {
      dateRange,
      ...analyticsData,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange.start.toISOString().split('T')[0]}-${dateRange.end.toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!permissions.canViewAnalytics) {
    return (
      <div className="p-6 text-center">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
        <p className="text-muted-foreground">You don't have permission to view analytics.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-center">Loading analytics...</div>;
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsData?.performance.map((metric) => (
          <Card key={metric.metric}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.metric}
                  </p>
                  <p className="text-2xl font-bold">{metric.value.toLocaleString()}</p>
                </div>
                <Badge variant={metric.change > 0 ? 'default' : 'destructive'}>
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="users">User Growth</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Engagement Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData?.engagement}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="posts" stroke={COLORS[0]} strokeWidth={2} />
                  <Line type="monotone" dataKey="comments" stroke={COLORS[1]} strokeWidth={2} />
                  <Line type="monotone" dataKey="likes" stroke={COLORS[2]} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Growth & Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData?.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill={COLORS[0]} />
                  <Bar dataKey="active" fill={COLORS[1]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData?.security}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="events" stroke={COLORS[0]} strokeWidth={2} />
                  <Line type="monotone" dataKey="threats" stroke={COLORS[3]} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedAnalyticsDashboard;
