
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  RefreshCw
} from 'lucide-react';
import { useSecurityAudit } from '@/hooks/useSecurityAudit';
import { RoleGuard } from './RoleGuard';

export const SecurityAuditDashboard: React.FC = () => {
  const { auditData, loading, error, refreshAudit, generateSecurityReport } = useSecurityAudit();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading security audit...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load security audit: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!auditData) return null;

  const report = generateSecurityReport();
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Audit</h2>
          <p className="text-muted-foreground">Review your account security status</p>
        </div>
        <Button onClick={refreshAudit} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Security Score Overview */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  <span className={getScoreColor(report.securityScore)}>
                    {report.securityScore}/100
                  </span>
                </span>
                <Badge variant={report.riskLevel === 'low' ? 'default' : 'destructive'}>
                  {report.riskLevel.toUpperCase()} RISK
                </Badge>
              </div>
              <Progress value={report.securityScore} className="h-2" />
              <p className="text-sm text-muted-foreground">{report.summary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Account Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {auditData.accountStatus === 'active' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="capitalize font-medium">{auditData.accountStatus}</span>
            </div>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Two-Factor Auth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {auditData.twoFactorEnabled ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className={auditData.twoFactorEnabled ? 'text-green-600' : 'text-red-600'}>
                {auditData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Failed Logins */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Failed Logins (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${auditData.failedLogins > 0 ? 'text-red-600' : 'text-green-600'}`} />
              <span className={auditData.failedLogins > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                {auditData.failedLogins}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {report && report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Security Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Recent Security Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditData.recentEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent security events</p>
            ) : (
              auditData.recentEvents.slice(0, 10).map((event) => (
                <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      event.metadata?.severity === 'high' ? 'bg-red-500' : 
                      event.metadata?.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{event.event_type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {event.metadata?.severity && (
                    <Badge variant="outline" className="text-xs">
                      {event.metadata.severity}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Suspicious Activity */}
      {auditData.suspiciousActivity.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Suspicious Activity Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditData.suspiciousActivity.map((activity) => (
                <div key={activity.id} className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-red-800">
                    {activity.event_type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                  {activity.metadata?.patterns && (
                    <div className="mt-2">
                      <p className="text-xs text-red-700">Patterns detected:</p>
                      <ul className="text-xs text-red-600 ml-4 list-disc">
                        {activity.metadata.patterns.map((pattern: string, index: number) => (
                          <li key={index}>{pattern.replace(/_/g, ' ')}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SecurityAuditDashboard;
