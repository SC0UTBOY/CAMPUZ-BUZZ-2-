
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, AlertTriangle, Clock, Eye } from 'lucide-react';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { format } from 'date-fns';

export const SecurityDashboard: React.FC = () => {
  const { 
    securityEvents, 
    securitySettings, 
    loading, 
    updateSecuritySettings 
  } = useSecurityMonitoring();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted/50 rounded-lg animate-pulse" />
        <div className="h-48 bg-muted/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  const hasSecurityConcerns = securitySettings?.failed_login_attempts && securitySettings.failed_login_attempts > 0;

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Overview
          </CardTitle>
          <CardDescription>
            Monitor your account security and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasSecurityConcerns && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {securitySettings.failed_login_attempts} failed login attempts detected. 
                Consider changing your password if you didn't attempt these logins.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Two-Factor Auth</span>
              </div>
              <Switch 
                checked={securitySettings?.two_factor_enabled || false}
                onCheckedChange={(checked) => updateSecuritySettings({ two_factor_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Security Questions</span>
              </div>
              <Badge variant={securitySettings?.security_questions_set ? "default" : "secondary"}>
                {securitySettings?.security_questions_set ? "Set" : "Not Set"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Password Age</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {securitySettings?.password_changed_at 
                  ? format(new Date(securitySettings.password_changed_at), 'MMM dd, yyyy')
                  : 'Unknown'
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Activity</CardTitle>
          <CardDescription>
            Your recent login and security events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {securityEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No recent security events
            </p>
          ) : (
            <div className="space-y-3">
              {securityEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm font-medium">
                        {event.event_type.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.user_agent?.substring(0, 50)}...
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(event.created_at), 'MMM dd, HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Security Actions</CardTitle>
          <CardDescription>
            Manage your account security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              Change Password
            </Button>
            <Button variant="outline" size="sm">
              Download Activity Log
            </Button>
            <Button variant="outline" size="sm">
              Review Login Sessions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
