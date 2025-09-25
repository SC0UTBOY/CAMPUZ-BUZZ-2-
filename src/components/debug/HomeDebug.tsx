import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export const HomeDebug: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNavigateHome = () => {
    navigate('/');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Card className="p-6 m-4">
      <h2 className="text-xl font-bold mb-4">🏠 Home Navigation Debug</h2>
      
      <div className="space-y-4">
        <div>
          <strong>Current Path:</strong> {location.pathname}
        </div>
        
        <div>
          <strong>Current Search:</strong> {location.search || 'None'}
        </div>
        
        <div>
          <strong>User Status:</strong> {user ? 'Authenticated' : 'Not authenticated'}
        </div>
        
        <div>
          <strong>User ID:</strong> {user?.id || 'No user ID'}
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleNavigateHome}>
            Navigate to Home (/)
          </Button>
          <Button onClick={handleRefresh} variant="outline">
            Refresh Page
          </Button>
        </div>
        
        <div className="mt-4 p-4 bg-muted rounded">
          <h3 className="font-semibold mb-2">Common Issues:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Check if FixedFastHomeFeed component is loading properly</li>
            <li>Verify authentication state</li>
            <li>Check browser console for errors</li>
            <li>Ensure database connection is working</li>
            <li>Check if posts are loading</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
