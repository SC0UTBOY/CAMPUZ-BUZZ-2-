
import React from 'react';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
  fallback?: React.ReactNode;
  showAlert?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallback,
  showAlert = false
}) => {
  const { hasRole, permissions, loading } = useRoleBasedAccess();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check role-based access
  if (requiredRole && !hasRole(requiredRole)) {
    if (fallback) return <>{fallback}</>;
    
    if (showAlert) {
      return (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You need {requiredRole} privileges to access this content.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  }

  // Check permission-based access
  if (requiredPermission && !permissions[requiredPermission as keyof typeof permissions]) {
    if (fallback) return <>{fallback}</>;
    
    if (showAlert) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this content.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  }

  return <>{children}</>;
};

export default RoleGuard;
