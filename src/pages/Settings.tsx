
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Settings as SettingsIcon, Users, AlertTriangle, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { ModerationDashboard } from '@/components/moderation/ModerationDashboard';
import { SecurityAuditDashboard } from '@/components/security/SecurityAuditDashboard';
import { RoleGuard } from '@/components/security/RoleGuard';

export default function Settings() {
  const { user } = useAuth();
  const { permissions, userRole } = useRoleBasedAccess();
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="general">
            <SettingsIcon className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="security">
            <Eye className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <RoleGuard requiredRole="moderator">
            <TabsTrigger value="moderation">
              <Shield className="h-4 w-4 mr-2" />
              Moderation
              <Badge variant="destructive" className="ml-2">
                {userRole?.toUpperCase()}
              </Badge>
            </TabsTrigger>
          </RoleGuard>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">User Role</p>
                  <Badge variant="outline">{userRole}</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Permissions</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(permissions).map(([permission, hasPermission]) => (
                      hasPermission && (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Badge>
                      )
                    ))}
                  </div>
                </div>
                <Button variant="outline">Update Profile</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Privacy settings will be implemented here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecurityAuditDashboard />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Notification settings will be implemented here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <RoleGuard requiredRole="moderator">
          <TabsContent value="moderation">
            <ModerationDashboard />
          </TabsContent>
        </RoleGuard>
      </Tabs>
    </div>
  );
}
