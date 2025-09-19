
import React from 'react';
import { EnhancedAuthGuard } from './EnhancedAuthGuard';

interface AuthGuardProps {
  children: React.ReactNode;
  requireRole?: string;
  checkSecurity?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireRole, checkSecurity }) => {
  return (
    <EnhancedAuthGuard requireRole={requireRole} checkSecurity={checkSecurity}>
      {children}
    </EnhancedAuthGuard>
  );
};
