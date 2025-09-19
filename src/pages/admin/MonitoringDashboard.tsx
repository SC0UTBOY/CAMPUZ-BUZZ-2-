
import React from 'react';
import { ProductionMonitoringDashboard } from '@/components/admin/ProductionMonitoringDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminService } from '@/services/adminService';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';

const MonitoringDashboard: React.FC = () => {
  const { user } = useAuth();
  const adminService = useAdminService();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const hasAccess = await adminService.isCurrentUserAdmin();
      setIsAdmin(hasAccess);
    } catch (error) {
      console.error('Failed to check admin access:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You need administrator privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ProductionMonitoringDashboard />;
};

export default MonitoringDashboard;
