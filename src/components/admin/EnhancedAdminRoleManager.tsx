
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, UserCheck, AlertTriangle, Activity } from 'lucide-react';
import { useEnhancedAdminService } from '@/services/enhancedAdminService';
import { validateUserRole, isValidUUID, createRateLimiter } from '@/utils/enhancedSecurityValidation';
import { EnhancedAuthGuard } from '@/components/auth/EnhancedAuthGuard';

// Rate limiter for role updates (max 5 attempts per minute)
const roleUpdateLimiter = createRateLimiter(5, 60000);

export const EnhancedAdminRoleManager: React.FC = () => {
  const [targetUserId, setTargetUserId] = useState('');
  const [newRole, setNewRole] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [securityStats, setSecurityStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    flaggedContent: number;
    securityEvents: number;
  } | null>(null);
  
  const adminService = useEnhancedAdminService();

  // Generate consistent client ID for rate limiting
  const clientId = `role-update-${window.navigator.userAgent}`;

  const handleRoleUpdate = async () => {
    // Clear previous errors
    setValidationError('');
    
    // Check rate limiting
    if (!roleUpdateLimiter.checkLimit(clientId)) {
      setValidationError('Too many role update attempts. Please wait before trying again.');
      return;
    }
    
    // Validate inputs
    if (!targetUserId.trim()) {
      setValidationError('User ID is required');
      return;
    }
    
    if (!isValidUUID(targetUserId)) {
      setValidationError('Invalid User ID format');
      return;
    }
    
    if (!newRole) {
      setValidationError('Please select a role');
      return;
    }
    
    const roleValidation = validateUserRole(newRole);
    if (!roleValidation.success) {
      setValidationError('Invalid role selected');
      return;
    }
    
    setIsUpdating(true);
    try {
      const success = await adminService.updateUserRole(targetUserId, newRole);
      if (success) {
        setTargetUserId('');
        setNewRole('');
        // Refresh security stats
        loadSecurityStats();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const loadSecurityStats = async () => {
    try {
      const stats = await adminService.getSecurityStats();
      setSecurityStats(stats);
    } catch (error) {
      console.error('Failed to load security stats:', error);
    }
  };

  React.useEffect(() => {
    loadSecurityStats();
  }, []);

  return (
    <EnhancedAuthGuard requireRole="admin" checkSecurity>
      <div className="space-y-6">
        {/* Security Stats Dashboard */}
        {securityStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Total Users</p>
                    <p className="text-2xl font-bold">{securityStats.totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Active Users</p>
                    <p className="text-2xl font-bold">{securityStats.activeUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Flagged Content</p>
                    <p className="text-2xl font-bold">{securityStats.flaggedContent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Security Events</p>
                    <p className="text-2xl font-bold">{securityStats.securityEvents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Role Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Enhanced Role Management
            </CardTitle>
            <CardDescription>
              Update user roles and permissions with enhanced security validation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <UserCheck className="h-4 w-4" />
              <AlertDescription>
                Role changes are logged and take effect immediately. Use with caution.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetUserId">Target User ID</Label>
                <Input
                  id="targetUserId"
                  placeholder="Enter user UUID (validated format required)"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  disabled={isUpdating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newRole">New Role</Label>
                <Select value={newRole} onValueChange={setNewRole} disabled={isUpdating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Student</Badge>
                        <span className="text-sm text-muted-foreground">Basic user permissions</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="faculty">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Faculty</Badge>
                        <span className="text-sm text-muted-foreground">Enhanced content creation</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="moderator">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Moderator</Badge>
                        <span className="text-sm text-muted-foreground">Content moderation powers</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">Admin</Badge>
                        <span className="text-sm text-muted-foreground">Full system access</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {validationError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleRoleUpdate}
                disabled={isUpdating || !targetUserId || !newRole}
                className="w-full"
              >
                {isUpdating ? 'Updating Role...' : 'Update User Role'}
              </Button>
              
              <div className="text-sm text-muted-foreground">
                Rate limit: {roleUpdateLimiter.getRemainingAttempts(clientId)} attempts remaining this minute
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </EnhancedAuthGuard>
  );
};
