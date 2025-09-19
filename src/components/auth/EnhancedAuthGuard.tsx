
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthPages } from './AuthPages';
import { LoadingSkeletons } from '@/components/common/LoadingSkeletons';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { Shield } from 'lucide-react';

interface EnhancedAuthGuardProps {
  children: React.ReactNode;
  requireRole?: string;
  checkSecurity?: boolean;
}

export const EnhancedAuthGuard: React.FC<EnhancedAuthGuardProps> = ({ 
  children, 
  requireRole,
  checkSecurity = false 
}) => {
  const { user, loading } = useAuth();
  const { hasRole, loading: roleLoading } = useRoleBasedAccess();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      // Add a small delay to prevent flash
      const timer = setTimeout(() => {
        setShowAuth(true);
      }, 100);
      return () => clearTimeout(timer);
    } else if (user) {
      setShowAuth(false);
    }
  }, [loading, user]);

  // Show loading spinner while auth is being determined
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading CampuzBuzz...</p>
        </div>
      </div>
    );
  }

  // Show auth pages if user is not authenticated
  if (!user && showAuth) {
    return <AuthPages />;
  }

  // Check role requirements if specified
  if (user && requireRole && !hasRole(requireRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">Access Restricted</h2>
          <p className="text-muted-foreground">
            You don't have the required permissions to access this page.
            {requireRole && ` Required role: ${requireRole}`}
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated and has required role, show the app
  if (user) {
    return <>{children}</>;
  }

  // Fallback loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSkeletons type="feed" count={1} />
    </div>
  );
};
