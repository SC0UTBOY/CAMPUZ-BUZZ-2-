
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, Activity, Eye, RefreshCw } from 'lucide-react';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { useAuthSecurity } from '@/hooks/useAuthSecurity';
import { EnhancedAuthGuard } from '@/components/auth/EnhancedAuthGuard';
import { checkSecurityHeaders } from '@/utils/enhancedSecurityValidation';

export const SecurityMonitoringDashboard: React.FC = () => {
  const { securityEvents, securitySettings, loading, refreshSecurityData } = useSecurityMonitoring();
  const { securityState, isSecureEnvironment } = useAuthSecurity();
  const [systemSecurityCheck, setSystemSecurityCheck] = useState<{ secure: boolean; warnings: string[] } | null>(null);

  useEffect(() => {
    // Perform system security check
    const securityCheck = checkSecurityHeaders();
    setSystemSecurityCheck(securityCheck);
  }, []);

  const getEventSeverityColor = (eventType: string) => {
    switch (eventType) {
      case 'user_signin_failed':
      case 'password_reset_requested':
        return 'destructive';
      case 'user_signin_success':
      case 'user_signup_attempt':
        return 'default';
      case 'security_settings_updated':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading security data...</span>
      </div>
    );
  }

  return (
    <EnhancedAuthGuard requireRole="admin" checkSecurity>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Security Monitoring</h1>
            <p className="text-muted-foreground">Monitor system security and user activity</p>
          </div>
          <Button onClick={refreshSecurityData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* System Security Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Security Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${isSecureEnvironment ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">
                  {isSecureEnvironment ? 'Secure Environment' : 'Insecure Environment'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${securityState.isSecureSession ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">
                  {securityState.isSecureSession ? 'Secure Session' : 'Session Issues'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${systemSecurityCheck?.secure ? 'bg-green-500' : 'bg-orange-500'}`} />
                <span className="text-sm">
                  {systemSecurityCheck?.secure ? 'Headers Valid' : 'Header Warnings'}
                </span>
              </div>
            </div>

            {systemSecurityCheck && !systemSecurityCheck.secure && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Security warnings detected:</p>
                    {systemSecurityCheck.warnings.map((warning, index) => (
                      <p key={index} className="text-sm">• {warning}</p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="events" className="space-y-4">
          <TabsList>
            <TabsTrigger value="events">Security Events</TabsTrigger>
            <TabsTrigger value="settings">Security Settings</TabsTrigger>
            <TabsTrigger value="activity">User Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Security Events
                </CardTitle>
                <CardDescription>
                  Monitor authentication and security-related activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {securityEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No security events recorded</p>
                ) : (
                  <div className="space-y-2">
                    {securityEvents.slice(0, 10).map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant={getEventSeverityColor(event.event_type)}>
                            {event.event_type.replace(/_/g, ' ')}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium">
                              {new Date(event.created_at).toLocaleString()}
                            </p>
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {JSON.stringify(event.metadata, null, 2).slice(0, 100)}...
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {event.ip_address || 'Unknown IP'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Configuration
                </CardTitle>
                <CardDescription>
                  Current security settings and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {securitySettings ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Authentication Security</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Two-Factor Enabled:</span>
                          <Badge variant={securitySettings.two_factor_enabled ? 'default' : 'destructive'}>
                            {securitySettings.two_factor_enabled ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Failed Login Attempts:</span>
                          <Badge variant={securitySettings.failed_login_attempts > 3 ? 'destructive' : 'default'}>
                            {securitySettings.failed_login_attempts}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Account Locked:</span>
                          <Badge variant={securitySettings.account_locked_until ? 'destructive' : 'default'}>
                            {securitySettings.account_locked_until ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Security Questions</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Questions Set:</span>
                          <Badge variant={securitySettings.security_questions_set ? 'default' : 'secondary'}>
                            {securitySettings.security_questions_set ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Password Change:</span>
                          <span className="text-muted-foreground">
                            {new Date(securitySettings.password_changed_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No security settings available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  User Activity Monitoring
                </CardTitle>
                <CardDescription>
                  Monitor user sessions and activity patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">
                        {securityState.sessionExpiry ? 
                          Math.floor((securityState.sessionExpiry.getTime() - Date.now()) / (1000 * 60)) : 0
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">Minutes Until Expiry</div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">
                        {Math.floor((Date.now() - securityState.lastActivity.getTime()) / (1000 * 60))}
                      </div>
                      <div className="text-sm text-muted-foreground">Minutes Since Activity</div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">
                        {securityState.deviceInfo.length > 0 ? '1' : '0'}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Sessions</div>
                    </div>
                  </div>
                  
                  {securityState.deviceInfo && (
                    <div className="p-3 bg-muted rounded-lg">
                      <h5 className="font-medium mb-2">Current Session Info</h5>
                      <p className="text-sm text-muted-foreground">{securityState.deviceInfo}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </EnhancedAuthGuard>
  );
};
