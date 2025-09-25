
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminServiceOptions {
  toast?: ReturnType<typeof useToast>['toast'];
}

class AdminService {
  private toast?: AdminServiceOptions['toast'];

  constructor(options?: AdminServiceOptions) {
    this.toast = options?.toast;
  }

  async updateUserRole(targetUserId: string, newRole: string): Promise<boolean> {
    try {
      // Use direct SQL query since the RPC function might not be immediately available in types
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
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

      this.toast?.({
        title: 'Role updated successfully',
        description: `User role has been changed to ${newRole}.`
      });

      return true;
    } catch (error) {
      console.error('Unexpected error updating user role:', error);
      this.toast?.({
        title: 'Unexpected error',
        description: 'Failed to update user role. Please try again.',
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
      console.error('Unexpected error fetching user role:', error);
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
}

export const adminService = new AdminService();

// Hook version for use in components
export const useAdminService = () => {
  const { toast } = useToast();
  return new AdminService({ toast });
};
