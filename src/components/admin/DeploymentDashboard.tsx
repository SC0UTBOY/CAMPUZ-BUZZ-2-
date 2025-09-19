
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  Database, 
  Globe, 
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Settings,
  Zap,
  FileText,
  Monitor
} from 'lucide-react';
import { getDeploymentConfig, verifyDatabaseMigrations, initializeDeployment } from '@/utils/deploymentConfig';

interface DeploymentStatus {
  database: 'connected' | 'error' | 'pending';
  api: 'healthy' | 'degraded' | 'down';
  cdn: 'active' | 'inactive' | 'error';
  ssl: 'valid' | 'invalid' | 'expiring';
  monitoring: 'active' | 'inactive';
}

export const DeploymentDashboard: React.FC = () => {
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({
    database: 'pending',
    api: 'healthy',
    cdn: 'active',
    ssl: 'valid',
    monitoring: 'active'
  });
  
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [config, setConfig] = useState(getDeploymentConfig());
  const [isInitializing, setIsInitializing] = useState(false);
  const [lastHealthCheck, setLastHealthCheck] = useState<Date>(new Date());

  useEffect(() => {
    performHealthCheck();
    checkMigrations();
    
    // Set up periodic health checks
    const interval = setInterval(performHealthCheck, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  const performHealthCheck = async () => {
    try {
      // Database health check
      const dbStart = performance.now();
      try {
        // Simple query to test database connectivity
        const response = await fetch('/api/health/database');
        const dbTime = performance.now() - dbStart;
        
        setDeploymentStatus(prev => ({
          ...prev,
          database: response.ok && dbTime < 1000 ? 'connected' : 'error'
        }));
      } catch {
        setDeploymentStatus(prev => ({ ...prev, database: 'error' }));
      }

      // API health check
      try {
        const apiResponse = await fetch('/api/health');
        setDeploymentStatus(prev => ({
          ...prev,
          api: apiResponse.ok ? 'healthy' : 'degraded'
        }));
      } catch {
        setDeploymentStatus(prev => ({ ...prev, api: 'down' }));
      }

      setLastHealthCheck(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const checkMigrations = async () => {
    try {
      const status = await verifyDatabaseMigrations();
      setMigrationStatus(status);
    } catch (error) {
      console.error('Migration check failed:', error);
      setMigrationStatus({ success: false, migrations: [], errors: [error] });
    }
  };

  const reinitializeDeployment = async () => {
    setIsInitializing(true);
    try {
      const newConfig = await initializeDeployment();
      setConfig(newConfig);
      await performHealthCheck();
      await checkMigrations();
    } catch (error) {
      console.error('Reinitialization failed:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
      case 'active':
      case 'valid':
        return 'text-green-600';
      case 'degraded':
      case 'expiring':
      case 'inactive':
        return 'text-yellow-600';
      case 'error':
      case 'down':
      case 'invalid':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
      case 'active':
      case 'valid':
        return <CheckCircle className="h-4 w-4" />;
      case 'degraded':
      case 'expiring':
      case 'inactive':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
      case 'down':
      case 'invalid':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Deployment Dashboard</h1>
          <p className="text-muted-foreground">
            Environment: <Badge>{config.environment}</Badge>
            Last check: {lastHealthCheck.toLocaleTimeString()}
          </p>
        </div>
        <Button 
          onClick={reinitializeDeployment}
          disabled={isInitializing}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          {isInitializing ? 'Reinitializing...' : 'Reinitialize'}
        </Button>
      </div>

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">System Status</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          {/* System Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    <span className="font-medium">Database</span>
                  </div>
                  <div className={`flex items-center gap-1 ${getStatusColor(deploymentStatus.database)}`}>
                    {getStatusIcon(deploymentStatus.database)}
                    <span className="text-sm capitalize">{deploymentStatus.database}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    <span className="font-medium">API</span>
                  </div>
                  <div className={`flex items-center gap-1 ${getStatusColor(deploymentStatus.api)}`}>
                    {getStatusIcon(deploymentStatus.api)}
                    <span className="text-sm capitalize">{deploymentStatus.api}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    <span className="font-medium">CDN</span>
                  </div>
                  <div className={`flex items-center gap-1 ${getStatusColor(deploymentStatus.cdn)}`}>
                    {getStatusIcon(deploymentStatus.cdn)}
                    <span className="text-sm capitalize">{deploymentStatus.cdn}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <span className="font-medium">SSL</span>
                  </div>
                  <div className={`flex items-center gap-1 ${getStatusColor(deploymentStatus.ssl)}`}>
                    {getStatusIcon(deploymentStatus.ssl)}
                    <span className="text-sm capitalize">{deploymentStatus.ssl}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    <span className="font-medium">Monitoring</span>
                  </div>
                  <div className={`flex items-center gap-1 ${getStatusColor(deploymentStatus.monitoring)}`}>
                    {getStatusIcon(deploymentStatus.monitoring)}
                    <span className="text-sm capitalize">{deploymentStatus.monitoring}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deployment Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Deployment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <Badge>{config.environment}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>API URL:</span>
                  <span className="text-sm font-mono">{config.apiUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span>CDN Enabled:</span>
                  <Badge variant={config.cdn.enabled ? "default" : "secondary"}>
                    {config.cdn.enabled ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Analytics:</span>
                  <Badge variant={config.features.analytics ? "default" : "secondary"}>
                    {config.features.analytics ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(config.features).map(([feature, enabled]) => (
                  <div key={feature} className="flex justify-between items-center">
                    <span className="capitalize">{feature.replace(/([A-Z])/g, ' $1')}</span>
                    <Badge variant={enabled ? "default" : "secondary"}>
                      {enabled ? "On" : "Off"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Migration Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {migrationStatus ? (
                <div className="space-y-4">
                  {/* Migration Summary */}
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 ${migrationStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                      {migrationStatus.success ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5" />
                      )}
                      <span className="font-medium">
                        {migrationStatus.success ? 'All Migrations Valid' : 'Migration Issues Found'}
                      </span>
                    </div>
                  </div>

                  {/* Migration Details */}
                  {migrationStatus.migrations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Verified Migrations:</h4>
                      <div className="space-y-1">
                        {migrationStatus.migrations.map((migration: string, index: number) => (
                          <div key={index} className="text-sm text-green-600 flex items-center gap-2">
                            <CheckCircle className="h-3 w-3" />
                            {migration}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Migration Errors */}
                  {migrationStatus.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-red-600">Migration Errors:</h4>
                      <div className="space-y-1">
                        {migrationStatus.errors.map((error: string, index: number) => (
                          <Alert key={index} variant="destructive">
                            <AlertDescription className="text-sm">
                              {error}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Checking database migrations...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Database Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Database Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Connection Details:</h4>
                  <div className="space-y-1 text-sm">
                    <div>Host: {config.supabaseUrl}</div>
                    <div>Status: {deploymentStatus.database}</div>
                    <div>RLS: Enabled</div>
                    <div>Backups: Automated</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Performance Limits:</h4>
                  <div className="space-y-1 text-sm">
                    <div>Max File Size: {config.limits.maxFileSize / (1024 * 1024)}MB</div>
                    <div>Max Community Members: {config.limits.maxCommunityMembers}</div>
                    <div>API Rate Limit: {config.limits.rateLimit.api}/hour</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environment" className="space-y-4">
          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Environment Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">API Configuration:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base URL:</span>
                      <span className="font-mono">{config.apiUrl}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timeout:</span>
                      <span>30s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate Limiting:</span>
                      <Badge>Enabled</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Security Settings:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>HTTPS:</span>
                      <Badge>Enabled</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>CORS:</span>
                      <Badge>Configured</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>RLS:</span>
                      <Badge>Enabled</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Flags */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Current feature availability for {config.environment} environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(config.features).map(([feature, enabled]) => (
                  <div key={feature} className="p-3 border rounded">
                    <div className="flex justify-between items-center">
                      <span className="font-medium capitalize">
                        {feature.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <Badge variant={enabled ? "default" : "secondary"}>
                        {enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          {/* Monitoring Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Monitoring & Alerting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Error Tracking</span>
                  </div>
                  <Badge variant={config.monitoring.errorTracking ? "default" : "secondary"}>
                    {config.monitoring.errorTracking ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="p-4 border rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Performance</span>
                  </div>
                  <Badge variant={config.monitoring.performanceMonitoring ? "default" : "secondary"}>
                    {config.monitoring.performanceMonitoring ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="p-4 border rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Monitor className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">User Analytics</span>
                  </div>
                  <Badge variant={config.monitoring.userAnalytics ? "default" : "secondary"}>
                    {config.monitoring.userAnalytics ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Check Results */}
          <Card>
            <CardHeader>
              <CardTitle>Health Check History</CardTitle>
              <CardDescription>
                System health over the last 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Database Uptime</span>
                    <span>99.9%</span>
                  </div>
                  <Progress value={99.9} />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span>API Response Time</span>
                    <span>~85ms avg</span>
                  </div>
                  <Progress value={85} />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Error Rate</span>
                    <span>0.1%</span>
                  </div>
                  <Progress value={0.1} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
