
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertTriangle,
  Shield,
  Users,
  MessageSquare,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  VolumeX,
  Trash2
} from 'lucide-react';
import { useModeration } from '@/hooks/useModeration';
import { formatDistanceToNow } from 'date-fns';
import { ModerationActionModal } from './ModerationActionModal';
import { AutoModerationRules } from './AutoModerationRules';

export const ModerationDashboard: React.FC = () => {
  const {
    postReports,
    userReports,
    moderationActions,
    loadingPostReports,
    loadingUserReports,
    loadingActions,
    reportFilters,
    setReportFilters,
    resolveReport,
    resolvingReport
  } = useModeration();

  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);

  const pendingPostReports = postReports.filter(r => r.status === 'pending').length;
  const pendingUserReports = userReports.filter(r => r.status === 'pending').length;
  const totalPending = pendingPostReports + pendingUserReports;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      case 'reviewing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleResolveReport = (reportId: string, reportType: 'post' | 'user', status: 'resolved' | 'dismissed') => {
    resolveReport({
      reportId,
      reportType,
      resolution: { status }
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Moderation Dashboard</h1>
          <p className="text-muted-foreground">
            Manage reports, take actions, and maintain community standards
          </p>
        </div>
        {totalPending > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {totalPending} pending reports
          </Badge>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{pendingPostReports}</p>
                <p className="text-sm text-muted-foreground">Post Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{pendingUserReports}</p>
                <p className="text-sm text-muted-foreground">User Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{moderationActions.length}</p>
                <p className="text-sm text-muted-foreground">Actions Taken</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">Active</p>
                <p className="text-sm text-muted-foreground">Auto Moderation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="post-reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="post-reports">
            Post Reports
            {pendingPostReports > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingPostReports}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="user-reports">
            User Reports
            {pendingUserReports > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingUserReports}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="actions">Moderation Actions</TabsTrigger>
          <TabsTrigger value="auto-rules">Auto Moderation</TabsTrigger>
        </TabsList>

        <TabsContent value="post-reports" className="space-y-4">
          <div className="flex space-x-2 mb-4">
            <Button
              variant={reportFilters.status === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setReportFilters({ status: 'pending' })}
            >
              Pending
            </Button>
            <Button
              variant={reportFilters.status === 'resolved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setReportFilters({ status: 'resolved' })}
            >
              Resolved
            </Button>
            <Button
              variant={reportFilters.status === 'dismissed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setReportFilters({ status: 'dismissed' })}
            >
              Dismissed
            </Button>
          </div>

          {loadingPostReports ? (
            <div>Loading post reports...</div>
          ) : (
            <div className="space-y-4">
              {postReports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getSeverityColor(report.severity)}>
                            {report.severity}
                          </Badge>
                          <Badge variant="outline">{report.category}</Badge>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                        
                        <h3 className="font-medium mb-2">{report.reason}</h3>
                        {report.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {report.description}
                          </p>
                        )}
                        
                        <p className="text-xs text-muted-foreground">
                          Reported {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      
                      {report.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReport({ ...report, type: 'post' });
                              setActionModalOpen(true);
                            }}
                          >
                            Take Action
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveReport(report.id, 'post', 'resolved')}
                            disabled={resolvingReport}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveReport(report.id, 'post', 'dismissed')}
                            disabled={resolvingReport}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="user-reports" className="space-y-4">
          {/* Similar structure for user reports */}
          {loadingUserReports ? (
            <div>Loading user reports...</div>
          ) : (
            <div className="space-y-4">
              {userReports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getSeverityColor(report.severity)}>
                            {report.severity}
                          </Badge>
                          <Badge variant="outline">{report.category}</Badge>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                        
                        <h3 className="font-medium mb-2">{report.reason}</h3>
                        {report.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {report.description}
                          </p>
                        )}
                        
                        <p className="text-xs text-muted-foreground">
                          Reported {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      
                      {report.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReport({ ...report, type: 'user' });
                              setActionModalOpen(true);
                            }}
                          >
                            Take Action
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveReport(report.id, 'user', 'resolved')}
                            disabled={resolvingReport}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveReport(report.id, 'user', 'dismissed')}
                            disabled={resolvingReport}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          {loadingActions ? (
            <div>Loading moderation actions...</div>
          ) : (
            <div className="space-y-4">
              {moderationActions.map((action) => (
                <Card key={action.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <div>
                          <p className="font-medium">
                            {action.action_type.replace('_', ' ').toUpperCase()} applied to {action.target_type}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Reason: {action.reason}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      
                      {action.expires_at && (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          Expires {formatDistanceToNow(new Date(action.expires_at), { addSuffix: true })}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="auto-rules">
          <AutoModerationRules />
        </TabsContent>
      </Tabs>

      {/* Moderation Action Modal */}
      <ModerationActionModal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        report={selectedReport}
      />
    </div>
  );
};
