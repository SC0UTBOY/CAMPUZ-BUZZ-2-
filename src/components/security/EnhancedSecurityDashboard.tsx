
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  Eye, 
  UserX,
  Activity,
  Database,
  Key,
  RefreshCw
} from 'lucide-react';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { useAuthSecurity } from '@/hooks/useAuthSecurity';
import { useToast } from '@/hooks/use-toast';

export const EnhancedSecurityDashboard: React.FC = () => {
  const { toast } = useToast();
  const { securityEvents, securitySettings, loading, updateSecuritySettings } = useSecurityMonitoring();
  const { securityState, checkPasswordStrength, isSecureEnvironment } = useAuthSecurity();
  
  const [securityScore, setSecurityScore] = useState(0);
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [isRunningAudit, setIsRunningAudit] = useState(false);

  useEffect(() => {
    calculateSecurityScore();
    runSecurityAudit();
  }, [securitySettings, securityEvents]);

  const calculateSecurityScore = () => {
    let score = 0;
    const maxScore = 100;
    
    // Base security checks
    if (isSecureEnvironment) score += 20;
    if (securityState.isSecureSession) score += 20;
    if (securitySettings?.two_factor_enabled) score += 25;
    if (securitySettings?.security_questions_set) score += 15;
    if (securitySettings?.failed_login_attempts === 0) score += 10;
    if (!securitySettings?.account_locked_until) score += 10;
    
    setSecurityScore(Math.min(score, maxScore));
  };

  const runSecurityAudit = async () => {
    setIsRunningAudit(true);
    try {
      const issues: any[] = [];
      
      // Check for security issues
      if (!isSecureEnvironment) {
        issues.push({
          type: 'Environment Security',
          severity: 'high',
          description: 'Application not running over HTTPS',
          recommendation: 'Enable HTTPS for production deployment'
        });
      }
      
      if (!securitySettings?.two_factor_enabled) {
        issues.push({
          type: 'Two-Factor Authentication',
          severity: 'medium',
          description: '2FA is not enabled',
          recommendation: 'Enable two-factor authentication for enhanced security'
        });
      }
      
      if (securitySettings?.failed_login_attempts && securitySettings.failed_login_attempts > 3) {
        issues.push({
          type: 'Failed Login Attempts',
          severity: 'high',
          description: `${securitySettings.failed_login_attempts} failed login attempts detected`,
          recommendation: 'Review account activity and consider password reset'
        });
      }
      
      if (!securityState.isSecureSession) {
        issues.push({
          type: 'Session Security',
          severity: 'medium',
          description: 'Session may be expired or insecure',
          recommendation: 'Refresh your session or log in again'
        });
      }
      
      setVulnerabilities(issues);
    } catch (error) {
      console.error('Security audit failed:', error);
    } finally {
      setIsRunningAudit(false);
    }
  };

  const handleSecuritySettingChange = async (setting: string, value: boolean) => {
    try {
      await updateSecuritySettings({ [setting]: value });
      toast({
        title: "Security setting updated",
        description: `${setting.replace('_', ' ')} has been ${value ? 'enabled' : 'disabled'}.`
      });
    } catch (error) {
      toast({
        title: "Error updating setting",
        description: "Failed to update security setting.",
        variant: "destructive"
      });
    }
  };

  const getSecurityLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: 'bg-green-500', textColor: 'text-green-700' };
    if (score >= 70) return { level: 'Good', color: 'bg-blue-500', textColor: 'text-blue-700' };
    if (score >= 50) return { level: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { level: 'Poor', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const securityLevel = getSecurityLevel(securityScore);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading security dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityScore}/100</div>
            <Progress value={securityScore} className="mt-2" />
            <p className={`text-xs mt-1 ${securityLevel.textColor}`}>
              {securityLevel.level}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vulnerabilities.length}</div>
            <p className="text-xs text-muted-foreground">
              Issues detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {securityState.isSecureSession ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm">
                {securityState.isSecureSession ? 'Secure' : 'Insecure'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">2FA Status</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {securitySettings?.two_factor_enabled ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="text-sm">
                {securitySettings?.two_factor_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Overview</CardTitle>
              <CardDescription>
                Your current security status and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">HTTPS Protection</h4>
                  <p className="text-sm text-muted-foreground">
                    {isSecureEnvironment ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <Badge variant={isSecureEnvironment ? 'default' : 'destructive'}>
                  {isSecureEnvironment ? 'Secure' : 'Insecure'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Session Security</h4>
                  <p className="text-sm text-muted-foreground">
                    Last activity: {securityState.lastActivity.toLocaleString()}
                  </p>
                </div>
                <Badge variant={securityState.isSecureSession ? 'default' : 'destructive'}>
                  {securityState.isSecureSession ? 'Valid' : 'Expired'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Failed Login Attempts</h4>
                  <p className="text-sm text-muted-foreground">
                    {securitySettings?.failed_login_attempts || 0} attempts
                  </p>
                </div>
                <Badge variant={
                  (securitySettings?.failed_login_attempts || 0) === 0 ? 'default' : 'destructive'
                }>
                  {(securitySettings?.failed_login_attempts || 0) === 0 ? 'Clean' : 'Suspicious'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vulnerabilities" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Security Vulnerabilities</CardTitle>
                <CardDescription>
                  Issues that need your attention
                </CardDescription>
              </div>
              <Button 
                onClick={runSecurityAudit} 
                disabled={isRunningAudit}
                size="sm"
              >
                {isRunningAudit ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Run Audit
              </Button>
            </CardHeader>
            <CardContent>
              {vulnerabilities.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No vulnerabilities detected</h3>
                  <p className="text-muted-foreground">Your security configuration looks good!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vulnerabilities.map((vuln, index) => (
                    <Alert key={index} className={
                      vuln.severity === 'high' ? 'border-red-200' : 
                      vuln.severity === 'medium' ? 'border-yellow-200' : 'border-blue-200'
                    }>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{vuln.type}</h4>
                            <p className="text-sm mt-1">{vuln.description}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Recommendation: {vuln.recommendation}
                            </p>
                          </div>
                          <Badge variant={
                            vuln.severity === 'high' ? 'destructive' : 
                            vuln.severity === 'medium' ? 'secondary' : 'default'
                          }>
                            {vuln.severity}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure your security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  id="two-factor"
                  checked={securitySettings?.two_factor_enabled || false}
                  onCheckedChange={(checked) => 
                    handleSecuritySettingChange('two_factor_enabled', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="security-questions">Security Questions</Label>
                  <p className="text-sm text-muted-foreground">
                    Set up security questions for account recovery
                  </p>
                </div>
                <Switch
                  id="security-questions"
                  checked={securitySettings?.security_questions_set || false}
                  onCheckedChange={(checked) => 
                    handleSecuritySettingChange('security_questions_set', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Activity Log</CardTitle>
              <CardDescription>
                Recent security events for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {securityEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No recent activity</h3>
                  <p className="text-muted-foreground">Security events will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {securityEvents.slice(0, 10).map((event) => (
                    <div key={event.id} className="flex items-start space-x-3 pb-3 border-b last:border-b-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.event_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                        {event.ip_address && (
                          <p className="text-xs text-muted-foreground">
                            IP: {event.ip_address}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
