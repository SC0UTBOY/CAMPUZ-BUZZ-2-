
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateUserRole, isValidUUID, validateAndSanitizeInput } from '@/utils/enhancedSecurityValidation';

interface AdminServiceOptions {
  toast?: ReturnType<typeof useToast>['toast'];
}

class EnhancedAdminService {
  private toast?: AdminServiceOptions['toast'];

  constructor(options?: AdminServiceOptions) {
    this.toast = options?.toast;
  }

  async updateUserRole(targetUserId: string, newRole: string): Promise<boolean> {
    try {
      // Enhanced validation
      if (!isValidUUID(targetUserId)) {
        throw new Error('Invalid user ID format');
      }

      const roleValidation = validateUserRole(newRole);
      if (!roleValidation.success) {
        throw new Error(roleValidation.error || 'Invalid role');
      }

      // Check if current user has admin permissions
      const hasPermission = await this.isCurrentUserAdmin();
      if (!hasPermission) {
        throw new Error('Insufficient permissions to update user roles');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: roleValidation.role, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', targetUserId);

      if (error) {
        console.error('Error updating user role:', error);
        this.toast?.({
          title: 'Error updating role',
          description: error.message,
          variant: 'destructive'
        });
        return false;
      }

      // Log security event
      await this.logSecurityEvent('role_updated', {
        target_user_id: targetUserId,
        new_role: roleValidation.role
      });

      this.toast?.({
        title: 'Role updated successfully',
        description: `User role has been changed to ${roleValidation.role}.`
      });

      return true;
    } catch (error: any) {
      console.error('Error updating user role:', error);
      this.toast?.({
        title: 'Error updating role',
        description: error.message || 'Failed to update user role',
        variant: 'destructive'
      });
      return false;
    }
  }

  async getCurrentUserRole(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data?.role || null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  }

  async isCurrentUserAdmin(): Promise<boolean> {
    const role = await this.getCurrentUserRole();
    return role === 'admin';
  }

  async isCurrentUserModerator(): Promise<boolean> {
    const role = await this.getCurrentUserRole();
    return role === 'admin' || role === 'moderator';
  }

  private async logSecurityEvent(eventType: string, metadata: Record<string, any> = {}): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('security_events')
        .insert({
          user_id: user.id,
          event_type: eventType,
          metadata,
          user_agent: navigator.userAgent,
          ip_address: '127.0.0.1' // In production, this would be the real IP
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  async getSecurityStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    flaggedContent: number;
    securityEvents: number;
  }> {
    try {
      // Only admins can access security stats
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        throw new Error('Insufficient permissions');
      }

      const [
        { count: totalUsers },
        { count: flaggedContent },
        { count: securityEvents }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('content_flags').select('*', { count: 'exact', head: true }),
        supabase.from('security_events').select('*', { count: 'exact', head: true })
      ]);

      return {
        totalUsers: totalUsers || 0,
        activeUsers: 0, // Would need additional query for active users
        flaggedContent: flaggedContent || 0,
        securityEvents: securityEvents || 0
      };
    } catch (error) {
      console.error('Error fetching security stats:', error);
      throw error;
    }
  }
}

export const enhancedAdminService = new EnhancedAdminService();

export const useEnhancedAdminService = () => {
  const { toast } = useToast();
  return new EnhancedAdminService({ toast });
};
