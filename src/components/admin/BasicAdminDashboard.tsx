
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { analyticsService } from '@/services/analyticsService';
import { useEnhancedAdminService } from '@/services/enhancedAdminService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, MessageSquare, Heart, TrendingUp, Shield, AlertTriangle } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  flaggedContent: number;
  securityEvents: number;
}

export const BasicAdminDashboard: React.FC = () => {
  usePerformanceMonitor('BasicAdminDashboard');
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const adminService = useEnhancedAdminService();

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get engagement metrics
      const metrics = await analyticsService.getEngagementMetrics(timeRange);
      
      // Get security stats
      const securityStats = await adminService.getSecurityStats();
      
      if (metrics && securityStats) {
        setStats({
          totalUsers: securityStats.totalUsers,
          activeUsers: metrics.active_users,
          totalPosts: metrics.total_posts,
          totalComments: metrics.total_comments,
          totalLikes: metrics.total_likes,
          flaggedContent: securityStats.flaggedContent,
          securityEvents: securityStats.securityEvents
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for charts (in production, this would come from analytics)
  const engagementData = [
    { name: 'Mon', posts: 12, comments: 45, likes: 89 },
    { name: 'Tue', posts: 19, comments: 52, likes: 103 },
    { name: 'Wed', posts: 8, comments: 38, likes: 76 },
    { name: 'Thu', posts: 23, comments: 67, likes: 134 },
    { name: 'Fri', posts: 16, comments: 41, likes: 98 },
    { name: 'Sat', posts: 11, comments: 29, likes: 67 },
    { name: 'Sun', posts: 14, comments: 35, likes: 78 }
  ];

  const userActivityData = [
    { name: 'Week 1', activeUsers: 245 },
    { name: 'Week 2', activeUsers: 289 },
    { name: 'Week 3', activeUsers: 267 },
    { name: 'Week 4', activeUsers: 301 }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-24 bg-muted/50 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="h-96 bg-muted/50 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of platform analytics and security</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={timeRange === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('day')}
          >
            Day
          </Button>
          <Button
            variant={timeRange === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('week')}
          >
            Week
          </Button>
          <Button
            variant={timeRange === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('month')}
          >
            Month
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{stats?.activeUsers || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">{stats?.totalPosts || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Events</p>
                <p className="text-2xl font-bold">{stats?.securityEvents || 0}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="users">User Activity</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Engagement</CardTitle>
              <CardDescription>Posts, comments, and likes over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="posts" fill="#8884d8" name="Posts" />
                  <Bar dataKey="comments" fill="#82ca9d" name="Comments" />
                  <Bar dataKey="likes" fill="#ffc658" name="Likes" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Trends</CardTitle>
              <CardDescription>Active users over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="activeUsers" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Flagged Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{stats?.flaggedContent || 0}</div>
                <p className="text-sm text-muted-foreground">Items requiring review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  Security Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{stats?.securityEvents || 0}</div>
                <p className="text-sm text-muted-foreground">Authentication & security logs</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Moderation Queue: 3</Badge>
            <Badge variant="outline">Pending Reports: 1</Badge>
            <Badge variant="outline">System Health: Good</Badge>
            <Button size="sm" variant="outline">
              View All Reports
            </Button>
            <Button size="sm" variant="outline">
              User Management
            </Button>
            <Button size="sm" variant="outline">
              System Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
