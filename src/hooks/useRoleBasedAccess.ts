import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useRoleBasedAccess = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string>('student');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole('student'); // Default fallback
        } else {
          setUserRole(profile?.role || 'student');
        }
      } catch (error) {
        console.error('Error in role fetch:', error);
        setUserRole('student');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const hasRole = (requiredRole: string): boolean => {
    if (!user) return false;
    
    // Admin has access to everything
    if (userRole === 'admin') return true;
    
    // Moderator has access to moderator and student features
    if (userRole === 'moderator' && ['moderator', 'student'].includes(requiredRole)) {
      return true;
    }
    
    // Student only has access to student features
    if (userRole === 'student' && requiredRole === 'student') {
      return true;
    }
    
    return userRole === requiredRole;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  return {
    userRole,
    loading,
    hasRole,
    hasAnyRole,
    isAdmin: userRole === 'admin',
    isModerator: userRole === 'moderator',
    isStudent: userRole === 'student',
    permissions: {
      canViewAnalytics: userRole === 'admin',
      canManageUsers: userRole === 'admin',
      canModerate: ['admin', 'moderator'].includes(userRole)
    }
  };
};