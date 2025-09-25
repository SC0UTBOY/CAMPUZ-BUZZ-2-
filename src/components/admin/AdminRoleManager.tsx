
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, UserCheck, AlertTriangle } from 'lucide-react';
import { useAdminService } from '@/services/adminService';
import { validateUserRole, isValidUUID } from '@/utils/securityValidation';

interface AdminRoleManagerProps {
  currentUserRole?: string;
}

export const AdminRoleManager: React.FC<AdminRoleManagerProps> = ({ currentUserRole }) => {
  const [targetUserId, setTargetUserId] = useState('');
  const [newRole, setNewRole] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  const adminService = useAdminService();

  const handleRoleUpdate = async () => {
    // Clear previous errors
    setValidationError('');
    
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
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Only show this component to admins
  if (currentUserRole !== 'admin') {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Access denied. Admin privileges required to manage user roles.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role Management
        </CardTitle>
        <CardDescription>
          Update user roles and permissions. Exercise caution when modifying roles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <UserCheck className="h-4 w-4" />
          <AlertDescription>
            Role changes take effect immediately and affect user permissions across the platform.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetUserId">Target User ID</Label>
            <Input
              id="targetUserId"
              placeholder="Enter user UUID"
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
        </div>
      </CardContent>
    </Card>
  );
};
